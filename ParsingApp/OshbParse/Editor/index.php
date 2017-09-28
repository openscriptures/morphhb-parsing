<?php
#****************************************************************************************************************************
# Editor/index.php
#****************************************************************************************************************************
require_once ('../Library/configure_PHP.inc.php');
#set_PHP_options();
#start_compression();
#display_errors();

# Check Authorization

require_once ('Library/hbAuth.php');    # Create hbAuth object with login action being the default $_SERVER('PHP_SELF').
$auth = new hbAuth(false,false);        # and do not allow login or registration from this page.
if (!$auth->checkAuth())                                    # IF    no authorized login         THEN  ACCESS DENIED.
{ $error = 'You must login from the home page first.'; include 'View/accessdenied.html.php'; exit; }  
if (!$auth->can_edit())                                     # IF    member can't edit           THEN  ACCESS DENIED.
{ $error = 'Only Editors and Administrators smay access this page.'; include 'View/accessdenied.html.php'; exit; }
if ($auth->is_idle())                                       # IF    member has been idle too long THEN ACCESS DENIED.
{ $error = 'You have been automatically logged out due to inactivity. Please login again.'; 
  include 'View/accessdenied.html.php'; exit; 
}

require_once 'Library/db.inc.php';

require_once 'Model/ChapterReference.php';
require_once 'Model/Alert.php';

require_once 'Model/VerseWordPosition.php';
require_once 'Model/VerseWord.php';
require_once 'Model/Note.php';
require_once 'Admin/Member.php';

#require_once 'MemberForm.php';
#$category = 'Admin';                    # This lets the form handler know what items to present for edit dependent on
                                        # where the edit request is coming from.
                                        # Currently, values = Admin, User (Administrator, Contributor).

#============================================================================================================================
# Event handlers for page navigation
#============================================================================================================================
if (isset($_GET['redirect']))   { redirect($_GET['redirect']); exit(); }    # Simple redirect request

if (isset($_POST['action']) && $_POST['action'] == 'Edit')                  # Edit: start editing a chapter (< Alert Manager)
{ $auth->set_reference($_POST['reference']);  redirect(''); }

#============================================================================================================================
# Event handlers to delete/verify a note
#============================================================================================================================
if (isset($_POST['action']) and $_POST['action'] == 'DeleteNote')       
{ $note = Note::getbyid($_POST['noteID']); 
  $note->delete_this(); redirect("Editor/index.php?wordNotes=".$_POST['reference']);
}

if (isset($_POST['action']) and $_POST['action'] == 'VerifyNote')       
{ $noteId = $_POST['noteID'];
  $note   = Note::getbyid($noteId);
  $vw     = VerseWord::getby_noteId($noteId);
  Note::insert($note->morph, $vw->get_id(), $auth->getAuthData('id'), true);  # Write an Editor's verification note.
  $vw->set_morph($note->morph, 'verified');                             # Set status as 'verified'.
  redirect("Editor/index.php?wordNotes=".$_POST['reference']);
}

#============================================================================================================================
# Event handlers to PROCESS SUBMITTED FORMS: editform
#============================================================================================================================
#
# Editform: process submitted form to edit an existing member.
#
#if (isset($_POST['_qf__editform']))   
#{ $form = new MemberForm($category,'editform');       # Get a built form to access submit values
##  if ($form->delete->getValue()) { delete_article($form->articleid->getValue()); }
#  
#   if (!$form->validate())    { echo "not validate"; exit; } 
#
#  Member::updatetodb_byadmin($form->memberid->getValue(), $form->regrole->getValue(), 
#    $form->regrating->getValue(), $form->regfirst->getValue(), $form->reglast->getValue()); 
#  header('Location: .'); exit();
#}
#
#============================================================================================================================
# edit_member()   -- Get a member by his ID and construct and present an Edit Form for it
#                    (Use the article's category for rendering instructions and the populated article for form contents.)
#============================================================================================================================
#function edit_member($id)               
#{ global $category;
#
#  $member = Member::getbyid($id); 
#  $form = new MemberForm($category,'editform',$member);
#  start_admin_html(); $form->present_form($member); end_admin_html(); exit;
#}
#
#
#

#============================================================================================================================
# Render HTML. 
#============================================================================================================================
$wordNotes = isset($_GET['wordNotes']) ? $_GET['wordNotes'] : '';           # VerseWordReference string: e.g. "Gen.1.1.0'

start_admin_html();
if (!$wordNotes) manage_alerts();                       # Manage Alerts
else             manage_word_notes($wordNotes);         # Manage Word Notes
end_admin_html('index.php?usePos=usePos');

#============================================================================================================================
# Manage Word Notes
#============================================================================================================================

function manage_word_notes($vwref)
{ $refpos = VerseWordPosition::get_VerseWordPosition($vwref);
  $word = new VerseWord($refpos->get_verseword());      # Get the VerseWord.
  $notes = Note::get_AllInWord($word->get_id());        # Get all the notes for the VerseWord.

  $hcols = array(                                       # Define hb.notes columns' headings and titles.
    'morph'         => 'Submitted morphology', 
    'member'        => 'Member who submitted the morph',
    'verification'  => 'Whether note is an editor verification',
    'noteDate'      => 'When submitted',
    'noteText'      => 'TBD: textual notes about the selection'
  );
 
  $id       = $word->get_id();
  $spelling = $word->get_word();
  $lemma    = $word->get_lemma();
  $status   = $word->get_status();
  echo "<section class='admin'><h3 title='wordId = $id'>Notes for $vwref</h3>";
  echo "<center><h2>$spelling</h2><span title='lemma'>$lemma</span></center>";
  echo "<center><span title='status'>$status</span></center>";
?>
  <p><ol style="list-style-type:none;">
    <li>Hover over a <i>column heading</i> to see a description of the column data.</li>
  </ol></p>
<?php
  start_admin_table($hcols);

  list_word_notes($notes, $vwref);
  echo "</table></section>";
}

function list_word_notes($notes, $vwref)                               # List notes.
{ foreach ($notes as $note) 
  { #$cr = ChapterReference::get_ChapterReference($alert->bookId, $alert->chapter);
    #$title      = ' title="'.$cr->bookOT.'"';
    $member = Member::getbyid($note->memberId);
    echo "<form action='?' method='post'><tr valign='top'>";
    echo "<td>"        . $note->morph               . "</td>"; 
    echo "<td>"        . $member->username          . "</td>"; 
    echo "<td>"        . ($note->verification ? 'Yes' : 'No')       . "</td>"; 
    echo "<td>"        . $note->friendly_notedate() . "</td>"; 
    echo "<td>"        . $note->noteText . "</td>"; 
    echo "<td><input type='hidden' name='noteID' value='" . html($note->id) . "'>";
    echo "<td><input type='hidden' name='reference' value='$vwref'>";
    echo    "<button name='action' value='DeleteNote' title='Delete this note.'>      Delete</button>";
    echo    "<button name='action' value='VerifyNote' title='Verify this note.'>      Verify</button>";
    echo "</td>";   
    #echo "<button name='action' value='Edit' title='Start editing" . $cr->fullname . "'>Edit</button>";
    echo "</td></tr></form>";
  } 
} 


#============================================================================================================================
# Manage Alerts
#============================================================================================================================

function manage_alerts()                                # Manage Alerts section
{ $hcols = array(                                       # Define hb.alerts columns' headings and titles.
    'book'     => 'Book name', 
    'chapter'  => 'Chapter number',
    'Options'  => 'Edit: start editing in this chapter'
  );

  echo "<section class='admin'><h3>Chapter Alerts: \"changed\"</h3>";
?>
  <p><ol style="list-style-type:none;">
    <li>Hover over a <i>column heading</i> to see a description of the column data.</li>
  </ol></p>
<?php
  start_admin_table($hcols);
    list_alerts(Alert::getbystatus('changed'));
  echo "</table></section>";
}

function list_alerts($alerts)                               # List alerts.
{ foreach ($alerts as $alert) 
  { $cr = ChapterReference::get_ChapterReference($alert->bookId, $alert->chapter);
    $title      = ' title="'.$cr->bookOT.'"';
    echo "<form action='?' method='post'><tr valign='top'>";
    echo "<td $title>" . $cr->book    . "</td>";
    echo "<td>"        . $cr->chapter . "</td>"; 
    echo "<td><input type='hidden' name='reference' value='" . $cr->versewordref(1,0) . "'>";
    echo "<button name='action' value='Edit' title='Start editing " . $cr->fullname . "'>Edit</button>";
    echo "</td></tr></form>";
  } 
} 

?>

