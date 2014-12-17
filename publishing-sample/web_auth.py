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

"""Module for using web flow for oauth.

1. set CLIENT_SECRETS to the file name containing the client secret info

2. set OAUTH2_STORAGE to the file name to store the credentials

call AuthorizeHttp()
returns an tuple of http object and the credentials that should be used.

"""

import httplib2
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage
from oauth2client.tools import run_flow

CLIENT_SECRETS = 'client_secrets.json'
OAUTH2_STORAGE = 'oauth2.dat'


def AuthorizeHttp(scope, flags, http=None):
  """Handles the OAuth2 auth flow using the web browser.

  Args:
    scope: the space separated list of scopes to authorize
    flags: the command line args
    http: yhe existing http object to add the authorization to

  Returns:
    tuple of the http object with authorization, and the credential object
  """
  flow = flow_from_clientsecrets(CLIENT_SECRETS, scope=scope)
  storage = Storage(OAUTH2_STORAGE)

  creds = storage.get()
  h = http if http else httplib2.Http()

  if creds is None or creds.invalid:
    creds = run_flow(flow, storage, flags)

  return (creds.authorize(h), creds)
