<?php
#****************************************************************************************************************************
# OshbParse/index.php
#****************************************************************************************************************************
#============================================================================================================================
# SITE CONFIGURATION AND TESTING STUFF
#============================================================================================================================
include 'Library/configure_PHP.inc.php';
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
# ESTABLISH AUTHORIZATION
#============================================================================================================================
include 'Library/hbAuth.php';
$auth = new hbAuth();                       # Create hbAuth object with login action being the default $_SERVER('PHP_SELF').

if (!$auth->checkAuth())                    # IF    not authorized
{ echo '</body></html>'; exit; }            # THEN  exit (hbAuth handles login error message rendering).
#if ($auth->getUsername() != 'darrell')      # ACCESS DENIED for maintenance.
#{ $error = 'The site is temporarily down for tuneup. Please come back later.'; include 'View/accessdenied.html.php'; exit; }
$mode = $auth->is_editing() ? 'Editor' : 'Parser'; 

#============================================================================================================================
# Get any word position from reference bookmark in database.
#============================================================================================================================

include 'Model/ChapterReference.php';
include 'Model/VerseWordPosition.php';

$ref       = $auth->get_reference();
$refpos    = $ref ? VerseWordPosition::get_VerseWordPosition($ref) : (new VerseWordPosition('Gen',1,1,0));
#============================================================================================================================
# HANDLE EVENTS
#============================================================================================================================

# Look for valid HTTPrequest POST or GET variables:

$chapterRef = isset($_GET['ref'])         ? $_GET['ref']         : ''; # ChapterReference string: e.g. "Gen.1". 
$chapterSav = isset($_POST['chapterSav']) ? $_POST['chapterSav'] : ''; # ChapterReference string: e.g. "Gen.1". 
$alertClose = isset($_POST['alertClose']) ? $_POST['alertClose'] : ''; # ChapterReference string to: close chapter by Alert.
$alertOpen  = isset($_POST['alertOpen'])  ? $_POST['alertOpen']  : ''; # ChapterReference string to: open chapter by Alert.
$morphSub   = isset($_POST['data'])       ? $_POST['data']       : ''; # MorphSubmission  string: e.g. "Gen.1.1.0 morph'.
$morphVer   = isset($_POST['verified'])   ? $_POST['verified']   : ''; # MorphSubmission  string: e.g. "Gen.1.1.0 morph'.
$morphErr   = isset($_POST['error'])      ? $_POST['error']      : ''; # MorphSubmission  string: e.g. "Gen.1.1.0 morph'.
$wordRef    = isset($_POST['pos'])        ? $_POST['pos']        : ''; # VerseWordReference string:    "Gen.1.1.0.0

if ($chapterRef || $chapterSav || $alertClose || $alertOpen || $morphSub || $morphVer || $morphErr || $wordRef) 
{ if ($auth->is_idle()) idle_member();                      # IF    member has been idle too long   THEN ACCESS DENIED! 
  function idle_member()                                    # HTTprequest response if the member has been idle too long
  { $error = 'You have been automatically logged out due to inactivity. Please login again.'; 
    include 'View/accessdenied.html.php'; exit; 
  }
}

# Respond to a HTTPrequest to RETRIEVE a whole chapter of markup data FROM the DB.

if ($chapterRef)                                    # Retrieve and echo the chapter's markup data to the client.
{ include 'Model/EditorMarkup.php';                 # (EditorMarkup will also include parent class ChapterMarkup).
  $retriever = ($mode == 'Parser' ? new ChapterMarkup($chapterRef) : new EditorMarkup($chapterRef));
  if ($refpos->get_chap_refstr() != $chapterRef)    # IF    reference bookmark chapter != requested chapterRef (not reload).
  { $cref     = $retriever->get_chapterRef();       # THEN  get and store a new reference (chapterRef's 1st word)
    $auth->set_reference($cref->versewordref(1,0)); 
  }
  echo $retriever->getMarkup();                     # Forward the selected chapter's markup to the client.
  exit;
}

# Respond to a HTTPrequest to save a chapter reference as a the new reference to the DB.
if ($chapterSav) 
{ $cref = new ChapterReference($chapterSav); 
  $auth->set_reference($cref->versewordref(1,0)); 
  exit; 
}
                                    

# Respond to a HTTPrequest to close or open a chapter via Alert status update into the DB.

if ($alertClose) { alertsub('closed', new ChapterReference($alertClose)); }
if ($alertOpen)  { alertsub('open',   new ChapterReference($alertOpen));  }

function alertsub($status, $cref) { echo Alert::update($status, $cref->bookId, $cref->chapter); exit; }

# Respond to a HTTPrequest to STORE a word's parsing and/or status into the DB.

if ($morphSub) morphsub('submit',$morphSub);    # STORE a submitted update of a word's parsing INTO the DB.
if ($morphVer) morphsub('verified',$morphVer);  # STORE a word's parsing with status as 'verified' INTO the DB.
if ($morphErr) morphsub('error',$morphErr);     # STORE a word's status as 'error' INTO the DB.

function morphsub($method, $poststring)         # Call a MorphSubmission method through SaveParsing
{ global $auth;
  require_once 'Model/SaveParsing.php';
  $storer = new SaveParsing(stripslashes(urldecode($poststring)), $auth->getAuthData('id'));       
  $morphsub = $storer->get_morphsub();          # Get SaveParsing's MorphSubmission container.
  echo $morphsub->$method();                    # Call the method and echo the word's returned status.
  exit;                                         # (Any errors will be echoed by the dependents and they will exit.)
}

# Respond to a HTTPrequest to STORE a new word position in chapter INTO the DB (wordpos can be 0 for first word).
#   Return: notes for any client processing.

if ($wordRef)     
{ $refpos = VerseWordPosition::get_VerseWordPosition($wordRef); 
  $auth->set_reference($wordRef);

  require_once 'Model/VerseWord.php';
  require_once 'Model/Note.php';
  require_once 'Admin/Member.php';
  $word = new VerseWord($refpos->get_verseword());   # Get the VerseWord.
  $notes = Note::get_AllInWord($word->get_id());     # Get all the notes for the VerseWord.

  $size = count($notes);
  if (!count($notes)) echo "no notes for word ".$word->get_id().$refpos->get_refstr();

#  if (count($notes) == 0 && $word->get_morph == null && $word->get->status == 'error')
#  { $word->set_status('none'); exit; }
  $selected = ' SELECTED';
  foreach ($notes as $note)
  { $morph  = $note->morph;
    $member = Member::getbyid($note->memberId)->username;
    echo "<option value='$morph'$selected>$morph $member</option>";
    $selected = ''; 
  }
  exit; 
}

#============================================================================================================================
# Not an httpresponse but a browser request to display the whole USER INTERFACE page.  
#============================================================================================================================
# If a logged in member's idle time is reached, log him out and make him log in again (the redirect clears POST/GET).

if ($auth->is_idle()) { $auth->logout(); redirect();  exit; }   

# Note: The logic of the above snippet cannot be in hbAuth because hbAuth has no knowledge whether this is an httprequest or
#       a browser request since that logic is determined in this script. And client httprequests must still be serviced
#       with ACCESS DENIED (above) until the member refreshes the browser page.


# Respond to any navigation Book Chapter Select form submission via Select button.
# If it is a new ChapterReference, over-ride refpos with a new position and store it in DB.
# This may be a browser reload also (which is why we get startword and scrollTop also).

# WHAT ABOUT CLEARING GET VARIABLES?
# WHAT ABOUT VERSE?

#print_r($_GET); echo '</br>';
if (isset($_GET['book']) && isset($_GET['chapter']))
{ $newrefpos  = new VerseWordPosition($_GET['book'], $_GET['chapter'], 1, 0, 0);
#    echo 'new reference'; exit;
  if ($newrefpos->get_chap_refstr() != $refpos->get_chap_refstr())
  { $refpos = $newrefpos;
    $auth->set_reference($refpos->get_refstr());
    redirect();     # clear post/get
#    echo $refpos->get_refstr();
  }
}

#  if ($refpos->get_chap_refstr() != $chapterRef)    # IF    reference bookmark chapter != requested chapterRef (not reload).
#  { $cref     = $retriever->get_chapterRef();       # THEN  get and store a new reference (chapterRef's 1st word)
#    $auth->set_reference($cref->versewordref(1,0)); 
#  }

$usePos     = isset($_GET['usePos']) ? true : false;           # Use reference position start word in chapter text
#print_r($refpos);
#echo $usePos ? 'true' : 'false'; 
# Render HTML (for PARSING a chapter's words or EDITING submitted parsings).
include 'View/ParseView.php';

?>
