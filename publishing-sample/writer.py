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

"""Unicode aware csv Dictionary writer.
"""
import codecs
import cStringIO
import csv


class UnicodeDictWriter(object):
  """Dictionary writer for csv that handles utf-8 encoding.
  """

  def __init__(self, f, cols, dialect=csv.excel, encoding='utf-8', **kwds):
    # Redirect output to a queue
    self.cols = cols
    self.queue = cStringIO.StringIO()
    self.writer = csv.writer(self.queue, dialect=dialect, **kwds)
    self.stream = f
    self.encoder = codecs.getincrementalencoder(encoding)()

  def _writerow(self, row):
    """Converts unicode string values when writing out the row.

    Args:
      row: - the row to be written

    Return:
      None
    """

    self.writer.writerow(
        [s.encode('utf-8') if isinstance(s, basestring) else s for s in row])
    # Fetch UTF-8 output from the queue ...
    data = self.queue.getvalue()
    data = data.decode('utf-8')
    # ... and reencode it into the target encoding
    data = self.encoder.encode(data)
    # write to the target stream
    self.stream.write(data)
    # empty queue
    self.queue.truncate(0)

  def writeheader(self):
    self._writerow(self.cols)

  def writerows(self, rows):
    for row in rows:
      self.writerow(row)

  def writerow(self, d):
    arr = []
    for c in self.cols:
      arr.append(d[c] if c in d else '')
    self._writerow(arr)
