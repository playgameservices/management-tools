/* Copyright (C) 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agree to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



var utilities = utilities || {};


/**
 * Creates cells in generated tables.
 *
 * @param {string} type The cell type; should be 'td' or 'th'.
 * @param {?string} text The text to insert into the cell.
 * @param {?string} bgColor The background color to set on the cell.
 * @param {?string} color The color to set text to.
 * @param {?number} colSpan The number of columns to span.
 * @param {?Object} append An element to append to the cell.
 * @return {Object} The generated table cell.
 */
utilities.createCell = function(type, text, bgColor, color, colSpan, append) {
  var cell = document.createElement(type);
  if (text) {
    cell.appendChild(document.createTextNode(text));
  }
  if (colSpan) {
    cell.setAttribute('colSpan', colSpan);
  }
  if (bgColor) {
    cell.style.backgroundColor = bgColor;
  }
  if (color) {
    cell.style.color = color;
  }
  if (append) {
    cell.appendChild(append);
  }
  return cell;
};


/**
 * Creates a button.
 *
 * @param {string} text The text for the button.
 * @param {string} value The value for the button.
 * @param {function} clickHandler The function handler for the click event.
 * @return {Object} The object representing the button.
 */
utilities.createButton = function(text, value, clickHandler) {
  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  if (value) {
    button.setAttribute('value', value);
  }
  button.appendChild(document.createTextNode(text));
  button.addEventListener('click', clickHandler, false);

  return button;
};


/**
 * Creates a textarea.
 *
 * @param {string} id The id to use on the textarea.
 * @param {string} width The textarea width.
 * @param {string} height The textarea height.
 * @param {string} text The textarea text.
 * @return {Object} The generated textarea.
 */
utilities.createTextArea = function(id, width, height, text) {
  var textArea = document.createElement('textarea');
  if (id) {
    textArea.id = id;
  }
  if (width) {
    textArea.style.width = '600px';
  }
  if (height) {
    textArea.style.height = '800px';
  }
  if (text) {
    textArea.innerText = text;
  }
  return textArea;
};


/**
 * Creates a text input box for sample UI.
 *
 * @param {number} size The input box size.
 * @param {string} value The value to set.
 * @param {boolean} isDisabled Set to true to disable the textinput.
 * @return {Object} The generated text input box.
 */
utilities.createTextInput = function(size, value, isDisabled) {
  var textInput = document.createElement('input');
  textInput.type = 'text';

  if (size) {
    textInput.length = size;
    textInput.size = size;
  }
  if (value) {
    textInput.value = value;
  }

  if (isDisabled) {
    textInput.disabled = true;
  }

  return textInput;
};


/**
 * Replaces double quotes with an escaped quote to prevent breaking queries
 * against the Google Drive API.
 *
 * @param {String} unescapedString The string to escape quotes on.
 * @return {String} A string escaped to not contain quotes.
 */
utilities.escapeQuotes = function(unescapedString) {
  if (!unescapedString) {
    return '';
  }
  unescapedString = unescapedString.replace(/\\/g, '\\\\');
  return unescapedString.replace(/"/g, '\\"');
};


/**
 * Checks an API response for errors and notifies the user.
 *
 * @param {Object} resp The API response object.
 * @param {String} successMessage The message to show on success.
 */
utilities.checkApiResponseAndNotify = function(resp, successMessage) {
  if (!resp) {
    alert('Error, response was invalid, value is : ' + resp);
  } else if (resp.error) {
    alert('Error ' + response.error.code + ': ' + response.error.message);
  } else {
    alert(successMessage);
  }
};


/**
 * Trims all whitespace from a string.
 *
 * @param {String} str The string to replace.
 */
utilities.trimWhitespace = function(str) {
  return str.replace(/ /g, '');
}
