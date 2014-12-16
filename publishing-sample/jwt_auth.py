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

"""Module for using service account for oauth.

1. set the path to the p12 file
2. set the client_email for the service account

call AuthorizeHttp()
returns an tuple of http object and the credentials that should be used.

"""

import httplib2
from oauth2client.client import SignedJwtAssertionCredentials


def AuthorizeHttp(scope, key_file, client_email, http=None):
  """Handles the OAuth2 auth flow using JWT.

  Args:
    scope: the space separated list of scopes to authorize
    key_file: the p12 key file to use as a key
    client_email: the client email address associated with the key
    http: the existing http object to add the authorization to

  Returns:
    tuple of the http object with authorization, and the credential object
  """
  with open(key_file, 'r') as fd:
    key = fd.read()

  creds = SignedJwtAssertionCredentials(client_email, key, scope)

  h = http
  if h is None:
    h = httplib2.Http()
  return (creds.authorize(h), creds)

