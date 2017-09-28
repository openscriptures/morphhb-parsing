<?php
#****************************************************************************************************************************
# templates.html.php -- common utilities for rendering html.
#****************************************************************************************************************************
#============================================================================================================================
# start_html() - for common pages: do head, start body and do page header.
#============================================================================================================================
function start_html()
{ ?>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OSHB Parsing</title>
    <link rel="stylesheet" href="/OshbParse/Style/OshbStyle.css" />
    <link rel="shortcut icon" href="/OshbParse/Image/OSHB.ico" />
    <!--[if IE]>
    <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
  </head>
<body> 
  <header>
    <h1><a href="/"><span class="logo"><span>The OpenScriptures</span><br />Hebrew Bible</span></a> – Parsing</h1>
  </header>
<?php
}

#============================================================================================================================
# start_admin_html() - for admin and edit pages: start html and do nav section 
# end_admin_html() 
# start_admin_table() 
#============================================================================================================================
function start_admin_html()                     
{ global $auth;

  start_html(); 
  echo "<nav><span id='personal_panel'>" . $auth->getUserName();
  button('logout_button', 'Log out.', 'Log Out');
  echo "</span></nav>";
} 

function end_admin_html($redir='')
{?>
  <section><?php show_goback_form(false, $redir); ?></section>
  <script src="../Script/sitenav.js"></script>
  </body></html>
<?php
}

function start_admin_table($hcols)
{ echo "<table><tr>";
  foreach ($hcols as $col => $title) echo "<th title='$title'>$col</th>";
  echo "</tr>";
}

#============================================================================================================================
# Widgets:
#   label()
#   button()
#   input_hidden()
#   show_goback_form()
#============================================================================================================================
function label($for, $title, $innerHTML)                { echo "<label for='$for' title='$title'>$innerHTML</label>"; } 

function button($id, $title, $innerHTML, $class=null)  
{ $class = ($class != null) ? " class='$class'" : ''; echo "<button id='$id'$class title='$title'>$innerHTML</button>"; } 

function input_hidden($id, $name, $value=null) 
{ $value = ($value != null) ? " value='$value'" : ''; echo "<input id='$id' type='hidden' name='$name'$value>"; }

function show_goback_form($help=false,$redir='')    # This will clear all GET and POST and go back to PHP_SELF unless redir  
{ echo  "<form id='goback' method='get'>";
  input_hidden('goback','goback');
#  if ($redir) echo '<input type="hidden" name="redirect" value="'.($redir == '/' ? '' : $redir).'"/>'; 
  if ($redir) input_hidden('redirect', 'redirect', $redir == '/' ? '' : $redir); 
  button("gobackbutton", "Go back to the previous page", "Go Back");
  if ($help)  echo '<span><a href="/cowrlc/php/admin/help.php" target="_blank" title="Display information about formatting text within text fields in another window.">HELP!</a></span>'; 
  echo "</form>";
}

?>

