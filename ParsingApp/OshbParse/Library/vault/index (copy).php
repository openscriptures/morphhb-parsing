<?php
require_once ('Library/OshbSetUp.php');
set_host_paths();
#set_PHP_options();
#start_compression();

#display_errors();
#echo "magic quotes=".get_magic_quotes_gpc(); # We want to make sure magic quotes is off;
#phpinfo();
#if (extension_loaded('gd') && function_exists('gd_info')) {
#    echo "PHP GD library is installed on your web server";
#}
#else {
#    echo "PHP GD library is NOT installed on your web server";
#}
#============================================================================================================================
# END OF CONFIG AND TESTING STUFF
#============================================================================================================================
require_once ('Library/DBConnect.php');                             # Include Database Connection Class.
$hbDB = new DBConnect();                                            # hb database connection.
if (!$hbDB || $hbDB->isError()) echo "ERROR"; #else echo ("NO CONNECT ERROR</br>");

require_once ('Library/hbAuth.php');
$auth = new hbAuth();                       # Create hbAuth object with login action being the default $_SERVER('PHP_SELF').

if (!$auth->checkAuth())                    # IF    not authorized
{ echo '</body></html>'; exit; }            # THEN  exit.

#$firstlast = "{$auth->getAuthData('firstName')} {$auth->getAuthData('lastName')}";
#$firstlast || $firstlast = $auth->getAuthData('username');

include 'Model/Books.php';
if (isset($_GET['ref'])) {
    $ref = $_GET['ref'];
    require_once ('Model/EditorMarkup.php');
    $instance = new ChapterMarkup($ref);
#    $instance = new EditorMarkup($ref);
    echo $instance->getMarkup();
} else if (isset($_POST['data'])) { // Update for the data.
    $data = stripslashes(urldecode($_POST['data']));
    $memberId = 1;
    include 'Model/SaveParsing.php';
    $instance = new SaveParsing($data,$memberId);
    echo $instance->Save();
} else {
    include 'View/ParseView.php';
}
?>
