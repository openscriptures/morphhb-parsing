/**
* Site navagition extra functionality
*/

// Click handler for the logout button.
var logoutClick = function() {                  // return false to stop processing any parent of the button.
  window.location="index.php?action=logout"; return false; 
};

// Click handler for the admin button.
var adminClick = function() {                   // return false to stop processing any parent of the button.
  window.location="Admin"; return false; 
};

// Click handler for the editor button.
var editorClick = function() {                  // return false to stop processing any parent of the button.
  window.location="index.php?action=startediting"; return false; 
};

// Click handler for the stop editing button.
var stopedClick = function() {                  // return false to stop processing any parent of the button.
  window.location="index.php?action=stopediting"; return false; 
};

// Click handler for the alerts button.
var alertsClick = function() {                   // return false to stop processing any parent of the button.
  window.location="Editor"; return false; 
};


var el = document.getElementById('logout_button');
if (el) { el.onclick = logoutClick; }
el = document.getElementById('admin_button');
if (el) { el.onclick  = adminClick; }
el = document.getElementById('editor_button');
if (el) { el.onclick = editorClick; }
el = document.getElementById('stoped_button');
if (el) { el.onclick = stopedClick; }
el = document.getElementById('alerts_button');
if (el) { el.onclick = alertsClick; }
