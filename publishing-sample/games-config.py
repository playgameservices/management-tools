#!/usr/bin/python
# -*- coding: utf-8 -*-
#
# Copyright 2014 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Command line sample for configuring play-games.

Configuring web based authentication refer to:
https://developers.google.com/api-client-library/python/guide/aaa_client_secrets


Usage:
  Listing achievements:
  python games-config.py achievement list <appId> --outcsv ach_data.csv

  Updating achievements:
  python games-config.py achievement update  --incsv ach_data.csv


Help by running
$ python games-config.py --help

Debugging
$ python games-config.py --logging_level=DEBUG

"""
import argparse
import csv
import httplib
import logging
import random
import sys
import time

from apiclient import errors
from apiclient.discovery import build
from apiclient.errors import HttpError
from apiclient.http import MediaFileUpload
import httplib2
from oauth2client import tools
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import SignedJwtAssertionCredentials
from oauth2client.file import Storage
from oauth2client.tools import run_flow
import writer

import pprint

# OAUTH2 client information.  This file can be downloaded
#  from the play games console.
# It is not needed if you are using a service account.
CLIENT_SECRETS = 'client_secrets.json'

# Local storage of the current oauth token.
OAUTH2_STORAGE = 'oauth2.dat'

# the scope needed to access this API.
SCOPE = 'https://www.googleapis.com/auth/androidpublisher'

logging.basicConfig()
logger = logging.getLogger(__name__)

# Maximum number of times to retry before giving up.
MAX_RETRIES = 10

# Always retry when these exceptions are raised.
RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError, httplib.NotConnected,
                        httplib.IncompleteRead, httplib.ImproperConnectionState,
                        httplib.CannotSendRequest, httplib.CannotSendHeader,
                        httplib.ResponseNotReady, httplib.BadStatusLine)

# Always retry when an apiclient.errors.HttpError with one of these status
# codes is raised.
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]


def main(argv):
  """Main program for demonstrating the play games configuration API.

  Args:
    argv: command line arguments

  Returns:
    None
  """

  # parse the arguments
  parser = argparse.ArgumentParser(
      description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter,
      parents=[tools.argparser]
  )

  parser.add_argument('--p12', default=None,
                      help='p12 key file for service account')
  parser.add_argument('--svcAccount', default=None,
                      help='Service Account email address')
  parser.add_argument('type', help='type of configuration',
                      choices=['achievement', 'leaderboard'])
  parser.add_argument('operation', help='operation to perform',
                      choices=['get', 'list', 'update', 'patch',
                               'image', 'insert', 'delete'])
  parser.add_argument('appId', help='Application id of the game',
                      nargs='?', default=None)
  parser.add_argument('--incsv', default=None, help='Path of input csv file')
  parser.add_argument('--image', default=None, help='Path of input image file')
  parser.add_argument('--outcsv', default=None, help='Path of output csv file')
  parser.add_argument('--incPublished', action='store_true',
                      help='Include published fields in operation')
  parser.add_argument('--noDraft', action='store_true',
                      help='Exclude draft (unpublished) fields in operation')

  flags = parser.parse_args(argv[1:])

  logger.setLevel(getattr(logging, flags.logging_level))
  if flags.logging_level == 'DEBUG':
    httplib2.debuglevel = 1

  # validate the args
  if flags.p12 is not None and flags.svcAccount is None:
    parser.error('--svcAccount is needed when specifying a key file')
  if flags.p12 is None and flags.svcAccount is not None:
    parser.error('--p12 is needed when specifying a service account')

  if flags.operation in ['list', 'insert'] and flags.appId is None:
    parser.error('insert and list operations require appId')
  elif flags.operation in ['update', 'patch', 'insert'] and flags.incsv is None:
    parser.error('update/patch operations requires --incsv <filename>')

  if flags.p12:
    f = file(flags.p12, 'rb')
    key = f.read()
    f.close()

    creds = SignedJwtAssertionCredentials(flags.svcAccount, key, SCOPE)

  else:
    flow = flow_from_clientsecrets(CLIENT_SECRETS, scope=SCOPE)
    storage = Storage(OAUTH2_STORAGE)

    creds = storage.get()

    if creds is None or creds.invalid:
      creds = run_flow(flow, storage, flags)

  http = httplib2.Http()
  http = creds.authorize(http)

  # build the api using the discovery document.
  service = build('gamesConfiguration','v1configuration', http=http)

  # do the correct operation
  if flags.type == 'achievement':
    api = AchievementConfig(service, flags.incPublished, flags.noDraft)
  elif flags.type == 'leaderboard':
    api = LeaderboardConfig(service, flags.incPublished, flags.noDraft)
  else:
    parser.error('unsupported type: ' + str(flags.type))
    return 1

  if flags.operation == 'list':
    api.list(flags)
  elif flags.operation == 'get':
    api.get(flags)
  elif flags.operation == 'patch':
    api.patch(flags)
  elif flags.operation == 'insert':
    api.insert(flags)
  elif flags.operation == 'update':
    api.update(flags)
  elif flags.operation == 'delete':
    api.delete(flags)
  elif flags.operation == 'image':
    api.image(flags)
  else:
    parser.error('operation: ' + str(flags.operation) +
                 ' is not supported...yet')
    return 1


class Configurable(object):
  """Base class for play games configurable objects.

    This class relies on the schema from the discovery document to
    be able to flatten and 'inflate' objects.  This makes it easy to read and
    write csv files for the configuration information.

  """
  _skipfields = ['kind']

  def __init__(self, service, schema_dict, default_type, incPublished, noDraft):
    self.default_type = default_type
    self.schema_dict = schema_dict
    if not incPublished:
      self._skipfields.append('published')
    if noDraft:
      self._skipfields.append('draft')

    # the image api is the same for both leaderboards and achievements.
    self.image_api = service.imageConfigurations()

  def _field_names(self, obj_type=None, prefix=''):
    """Returns the list of fields for the flattened response.

      This walks the schema for the AchievementConfiguration type and
      builds the list of fields.  This needs to be in sync with
      flatten and inflate

    Args:
      obj_type: the type of object
      prefix: the prefix of the key name.

    Returns:
      array of flattened field names.
    """
    if obj_type is None:
      obj_type = self.default_type
    names = []
    s = self.schema_dict.get(obj_type)
    for k, v in s['properties'].iteritems():
      if k in self._skipfields:
        continue
      if '$ref' in v or v['type'] == 'object':
        # recurse to sub type
        new_prefix = prefix + k + '_'
        names += self._field_names(v['$ref'], new_prefix)
      elif v['type'] == 'array':
        # don't add this field to the prefix
        new_prefix = prefix
        names += self._field_names(v['items']['$ref'], new_prefix)
      else:
        names.append(prefix + k)

    return names

  def flatten(self, obj, obj_type=None, prefix=''):
    """Flattens an object into a dictionary matching field names.

      This is used to prepare an object to be written out in
        flat format, e.g. csv

    Args:
      obj: the object to flatten
      obj_type: the type of the object
      prefix: the prefix for the key name
    Returns:
      dictionary object with the flattened fields.
    """

    if obj_type is None:
      obj_type = self.default_type

    item = {}
    s = self.schema_dict.get(obj_type)
    for k, v in s['properties'].iteritems():
      if '$ref' in v or v['type'] == 'object':
        # recurse to sub type
        new_prefix = prefix + k + '_'
        if k in obj:
          item.update(self.flatten(obj[k], v['$ref'], new_prefix))
      elif v['type'] == 'array':
        # process each element
        new_prefix = prefix
        for ele in obj[k]:
          element_data = self.flatten(ele, v['items']['$ref'], new_prefix)
          for ek, ev in element_data.iteritems():
            if ek in item:
              item[ek].append(ev)
            else:
              item[ek] = [ev]

      elif k in obj and k not in self._skipfields:
        item[prefix + k] = obj[k]

    return item

  def inflate(self, data):
    """Inflates a dictionary of flattened fields into an object.

    Args:
      data: the flattened dictionary object to inflate

    Returns:
      the merged dest object
    """

    obj = {}
    for k, v in data.iteritems():
      ob = obj
      parts = k.split('_')
      for i in range(0, len(parts) - 1):
        if parts[i] not in ob:
          ob[parts[i]] = {}
        ob = ob[parts[i]]
      ob[parts[len(parts) - 1]] = v

    return obj

  def _make_locale_rows(self, item):
    """Makes multiple rows for an object, one row per locale.

        This is used to split a single object into multiple rows

    Args:
      item: the object

    Returns:
     list of dictionaries, one per locale
    """

    common = {}
    arr_field = []
    num_locales = 0
    for k, v in item.iteritems():
      if type(v) in (list, tuple):
        arr_field.append(k)
        if num_locales < len(v):
          num_locales = len(v)
      else:
        common[k] = v

    rows = []
    for i in range(0, num_locales):
      rows.append(common.copy())
      for mls in arr_field:
        if len(item[mls]) > i:
          rows[i][mls] = item[mls][i]

    return rows

  def _merge_items(self, items, field, obj_type=None):
    """Merges list of objects based on the key field.

        This is used to combine multiple objects that have multi locale strings
        that need to be combined into an array of objects.

    Args:
      items: the list of items to merge
      field: the key field to determine if two objects should be merged.
      obj_type: the type of the objects being merged.

    Returns:
      the set of objects merged from the source items
    """

    if obj_type is None:
      obj_type = self.default_type

    data = {}
    for item in items:
      if item[field] not in data:
        data[item[field]] = self._merge_item({}, item, obj_type)
      else:
        data[item[field]] = self._merge_item(data[item[field]], item, obj_type)

    return data.values()

  def _merge_item(self, dest, src, obj_type=None):
    """Merges two objects.

        This is used to combine multiple objects that have multi locale strings
        that need to be combined into an array of objects.

    Args:
      dest: the dest object
      src: the source object
      obj_type: the type of the objects being merged.

    Returns:
      the merged dest object
    """

    if obj_type is None:
      obj_type = self.default_type

    s = self.schema_dict.get(obj_type)
    for k, v in s['properties'].iteritems():
      if '$ref' in v or v['type'] == 'object':
        # recurse to sub type
        if k not in dest and k in src:
          dest[k] = self._merge_item({}, src[k], v['$ref'])
        elif k in src:
          dest[k] = self._merge_item(dest[k], src[k], v['$ref'])
      elif v['type'] == 'array':
        if k not in dest:
          dest[k] = []
        elif not isinstance(dest[k], list):
          dest[k] = [dest[k]]
        if k in src:
          if obj_type(src[k]) not in (tuple, list):
            dest[k].append(src[k])
          else:
            dest[k] += src[k]

        # get the type of the items and move them from the current object into
        # an element
        ele_type = self.schema_dict.get(v['items']['$ref'])
        dest_ele = {}
        src_ele = {}
        for ek in ele_type['properties'].iterkeys():
          if ek in dest:
            dest_ele[ek] = dest[ek]
            del dest[ek]
          if ek in src:
            src_ele[ek] = src[ek]
            del src[ek]
        if dest_ele:
          dest[k].append(dest_ele)
        if src_ele:
          dest[k].append(src_ele)
      elif k in src:
        dest[k] = src[k]

    return dest

  def write_csv(self, rows, outfile=None):
    """Writes the given rows out to the csv file.

    Args:
      rows: the list of dictionary objects to write out
      outfile: the name of the output file.  If None, stdout is used.

    Returns:
      wr: the dictionary writer that can be used to write out additional rows

    """
    if outfile:
      fd = open(outfile, mode='wb')
    else:
      fd = sys.stdout

    wr = writer.UnicodeDictWriter(fd, self._field_names())
    wr.writeheader()
    wr.writerows(rows)

    return wr

  def image(self, flags):
    """Uploads the given image for the achievement/leaderboard."""

    if flags.type == 'achievement':
      img_type = 'ACHIEVEMENT_ICON'
    else:
      img_type = 'LEADERBOARD_ICON'

    media = MediaFileUpload(flags.image, chunksize=-1, resumable=True)
    req = self.image_api.upload(resourceId=flags.appId, imageType=img_type,
                                media_body=media)

    rsp = self.resumable_upload(req)

    print rsp['url']

  def resumable_upload(self, req):
    """Executes the resumable upload including retry.

    Args:
      req: the request to execute

    Returns:
      response
    """
    response = None
    error = None
    retry = 0
    while response is None:
      try:
        logger.debug('Uploading...')
        status, response = req.next_chunk()
        logger.debug('STATUS = %s, response = %s', status, response)
        if 'url' in response:
          logger.debug('upload was successful')
        else:
          exit('The upload failed with an unexpected response: %s' % response)
      except HttpError, e:
        if e.resp.status in RETRIABLE_STATUS_CODES:
          error = 'A retriable HTTP error %d occurred:\n%s' % (e.resp.status,
                                                               e.content)
        else:
          raise
      except RETRIABLE_EXCEPTIONS, e:
        error = 'A retriable error occurred: %s' % e

      if error is not None:
        logger.warning(error)
        retry += 1
        if retry > MAX_RETRIES:
          exit('No longer attempting to retry.')

        max_sleep = 2 ** retry
        sleep_seconds = random.random() * max_sleep
        print 'Sleeping %f seconds and then retrying...' % sleep_seconds
        time.sleep(sleep_seconds)

    return response


class AchievementConfig(Configurable):
  """API calls for configuring achievements.
  """

  def __init__(self, service, incPublished, noDraft):
    Configurable.__init__(self, service,
                          service.achievementConfigurations()._schema,
                          'AchievementConfiguration', incPublished, noDraft)
    self.api = service.achievementConfigurations()

  def list(self, flags):
    """Lists the requested achievements.

        writes out the achievements to the specified --outcsv file or
        to stdout.

    Args:
      flags: the command line args.

    Returns:
      None
    """

    rsp = self.api.list(applicationId=flags.appId).execute()

    rows = []
    if 'items' in rsp:
      pprint.pprint(rsp['items'])
      for item in rsp['items']:
        rows += self._make_locale_rows(self.flatten(item))

    self.write_csv(rows, outfile=flags.outcsv)

  def get(self, flags):
    """Gets the requested achievement.

        writes out the  achievement

    Args:
      flags: the command line args.

    Returns:
      None
    """

    rsp = self.api.get(achievementId=flags.appId).execute()

    rows = self._make_locale_rows(self.flatten(rsp))

    self.write_csv(rows, outfile=flags.outcsv)

  def update(self, flags):
    """Updates the provided achievements.

        writes out the updated achievements

    Args:
      flags: the command line args.

    Returns:
      None
    """

    in_fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(in_fd)

    items = []
    for d in csvdata:
      # patch up the data- remove empty fields
      if 'draft_description_locale' in d and not d['draft_description_locale']:
        del d['draft_description_locale']
      if 'draft_description_value' in d and not d['draft_description_value']:
        del d['draft_description_value']
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of objects based on id
    obj_list = self._merge_items(items, 'id')
    wr = None

    try:
      for i in obj_list:
        #  remove  draft.iconUrl - this is a read only field.
        if 'iconUrl' in i['draft']:
          del i['draft']['iconUrl']

        # remove stepsToUnlock for standard achievements
        # it is only for incremental achievements
        if i['achievementType'] == 'STANDARD':
          del i['stepsToUnlock']

        req = self.api.update(achievementId=i['id'],
                              body=i)
        rsp = req.execute()
        rows = self._make_locale_rows(self.flatten(rsp))
        if not wr:
          wr = self.write_csv(rows, outfile=flags.outcsv)
        else:
          wr.writerows(rows)
    except errors.HttpError, e:
      sys.stderr.write(str(e))

  def patch(self, flags):
    """Patches the provided achievements.

        writes out the updated achievements

    Args:
      flags: the command line args.

    Returns:
      None
    """

    in_fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(in_fd)
    wr = None

    items = []
    for d in csvdata:
      # patch up the data- remove empty fields
      if 'draft_description_locale' in d and not d['draft_description_locale']:
        del d['draft_description_locale']
      if 'draft_description_value' in d and not d['draft_description_value']:
        del d['draft_description_value']
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of  objects based on id
    obj_list = self._merge_items(items, 'id')
    for i in obj_list:
      # TODO(wilkinsonclay)  need to patch up the data
      #  remove  draft.iconUrl - it is a read-only field.
      if 'iconUrl' in i['draft']:
        del i['draft']['iconUrl']

      # remove stepsToUnlock for standard achievements
      #  it is only for incremental achievements
      if i['achievementType'] == 'STANDARD':
        del i['stepsToUnlock']

      rsp = self.api.patch(achievementId=i['id'], body=i).execute()

      # output each response
      rows = self._make_locale_rows(self.flatten(rsp))
      if not wr:
        self.write_csv(rows, outfile=flags.outcsv)
      else:
        wr.writerows(rows)

  def insert(self, flags):
    """Inserts the provided achievements.

        writes out the added achievements

    Args:
      flags: the command line args.

    Returns:
      None
    """

    in_fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(in_fd)
    wr = None

    items = []
    for d in csvdata:
      if 'draft_description_locale' in d and not d['draft_description_locale']:
        del d['draft_description_locale']
      if 'draft_description_value' in d and not d['draft_description_value']:
        del d['draft_description_value']
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of  objects based on id
    obj_list = self._merge_items(items, 'id')

    for i in obj_list:
      #  remove  draft.iconUrl - it is a read only field
      if 'iconUrl' in i['draft']:
        del i['draft']['iconUrl']

      # remove stepsToUnlock for standard achievements
      # it is only for incremental
      if i['achievementType'] == 'STANDARD':
        del i['stepsToUnlock']

      # remove the id, since this is insert
      if 'id' in i:
        del i['id']

      rsp = self.api.insert(applicationId=flags.appId, body=i).execute()
      # output each response
      rows = self._make_locale_rows(self.flatten(rsp))
      if not wr:
        wr = self.write_csv(rows, outfile=flags.outcsv)
      else:
        wr.writerows(rows)

  def delete(self, flags):
    """Deletes the specified achievement.

    Args:
      flags: the command line args.
    Returns:
      None
    """

    self.api.delete(achievementId=flags.appId).execute()
    # the response is 204 no-content so there is nothing to print.
    # an error will be thrown if there is a problem


class LeaderboardConfig(Configurable):
  """API calls for the configuring leaderboards.
  """

  def __init__(self, service, incPublished, noDraft):
    Configurable.__init__(self, service,
                          service.leaderboardConfigurations()._schema,
                          'LeaderboardConfiguration', incPublished, noDraft)
    self.api = service.leaderboardConfigurations()

  def list(self, flags):
    """Lists the requested leaderboards.

        writes out the leaderboards

    Args:
      flags: the command line args.

    Returns:
      None
    """

    rsp = self.api.list(applicationId=flags.appId).execute()

    rows = []
    if 'items' in rsp:
      for item in rsp['items']:
        rows += self._make_locale_rows(self.flatten(item))

      self.write_csv(rows, outfile=flags.outcsv)

  def get(self, flags):
    """Gets the requested leaderboard.

      writes out the  leaderboard

    Args:
      flags: the command line args.

    Returns:
      None
    """

    rsp = self.api.get(leaderboardId=flags.appId).execute()

    rows = self._make_locale_rows(self.flatten(rsp))

    self.write_csv(rows, outfile=flags.outcsv)

  def update(self, flags):
    """Updates the provided leaderboards.

        writes out the updated leaderboards

    Args:
      flags: the command line args.

    Returns:
      None
    """

    fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(fd)
    wr = None

    items = []
    for d in csvdata:
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of  objects based on id
    obj_list = self._merge_items(items, 'id')
    for i in obj_list:
      rsp = self.api.update(leaderboardId=i['id'], body=i).execute()
      rows = self._make_locale_rows(self.flatten(rsp))
      if not wr:
        wr = self.write_csv(rows, outfile=flags.outcsv)
      else:
        wr.writerows(rows)

  def patch(self, flags):
    """Patches the provided leaderboards.

    Writes out the updated leaderboards to --outcsv or stdout

    Args:
      flags: the command line args.

    Returns:
      None
    """

    fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(fd)
    wr = None

    items = []
    for d in csvdata:
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of  objects based on id
    obj_list = self._merge_items(items, 'id')
    for i in obj_list:
      rsp = self.api.patch(leaderboardId=i['id'], body=i).execute()
      rows = self._make_locale_rows(self.flatten(rsp))
      if not wr:
        wr = self.write_csv(rows, outfile=flags.outcsv)
      else:
        wr.writerows(rows)

  def insert(self, flags):
    """Insert new leaderboard.

        Inserts new leader boards and writes out the added leader boards
        to --outcsv or stdout

    Args:
      flags: the command line args.

    Returns:
      None
    """

    fd = open(flags.incsv, mode='rb')
    csvdata = csv.DictReader(fd)
    wr = None

    items = []
    for d in csvdata:
      items.append(self.inflate(d))

    # all the locales for the same field need to published at the same time,
    # so combine items into the minimum number of objects based on id
    obj_list = self._merge_items(items, 'id')
    for i in obj_list:
      rsp = self.api.insert(applicationId=flags.appId, body=i).execute()
      rows = self._make_locale_rows(self.flatten(rsp))
      if not wr:
        wr = self.write_csv(rows, outfile=flags.outcsv)
      else:
        wr.writerows(rows)


if __name__ == '__main__':
  main(sys.argv)

