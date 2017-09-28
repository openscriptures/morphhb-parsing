<?php
#****************************************************************************************************************************
# configure_PHP.inc.php -- PHP configuration for this website and HTTP header functions.
#****************************************************************************************************************************

date_default_timezone_set('America/Los_Angeles');
function nowdate() { return(date("Y-m-d H:i:s")); }

# Configure and set include paths

$sitedir    = '/OshbParse';                                     # website location relative to document root ('' if doc root)
$sitepath   = $_SERVER['DOCUMENT_ROOT'] . $sitedir;             # path to our web app
$pearlib    = $_SERVER['DOCUMENT_ROOT'] . '/pear/share/pear';   # path to local pear library
set_include_path($sitepath . PATH_SEPARATOR . $pearlib); 
#$phplib  = $_SERVER['DOCUMENT_ROOT'].'/phplib';           #       path to our phplib
#set_include_path($pearlib . get_include_path(). PATH_SEPARATOR . $phplib);
#set_include_path(get_include_path(). PATH_SEPARATOR . $oshbparse);

function set_PHP_options()
{
  ini_set('register_globals',         'Off');			
  ini_set('call_time_pass_reference', 'Off');			
  ini_set('short_open_tag',           'Off');			
  ini_set('asp_tags',                 'Off');			
  ini_set('error_reporting',          E_ALL);			
  ini_set('allow_url_fopen',          'Off');
  ini_set('sql.safe_mode',            'Off');
}

function display_errors()
{ ini_set('display_errors',             1);
  error_reporting(E_ALL);
}

#============================================================================================================================
# Header functions:
#   redirect()
#   get_URIroot()
#   start_compression()
#============================================================================================================================
function redirect($target='')      # SIMPLE REDIRECT (default is to "$sitedir/")
{ global $sitedir;
  if (!isset($_SERVER['SERVER_NAME'])) { trigger_error('No server name for redirect!'); return(false); }
#  echo get_URIroot(). "$sitedir/$target"; exit;
  header('Location: '. get_URIroot() . "$sitedir/$target");
  return(true);
}

function get_URIroot() { return('http://'.$_SERVER['SERVER_NAME']); }

function start_compression()    # if browser supports compression register compress_output() callback
{                               # and send header to notify browser of it.
function compress_output($output)                       # Callback function to compress $output
{ # We can perform additional manipulation on $output here, such  as stripping whitespace, etc. 
  return gzencode($output); 
} 
if (strstr($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip'))   # Check if browser supports gzip encoding
{ ob_start("compress_output");                          # Start output buffering, and register compress_output()
  header("Content-Encoding: gzip");                     # Tell the browser the content is compressed with gzip 
} 
}

?>
