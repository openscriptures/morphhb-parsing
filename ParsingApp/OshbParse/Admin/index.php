<?php
#****************************************************************************************************************************
# Admin/index.php
#****************************************************************************************************************************
require_once ('../Library/configure_PHP.inc.php');
#set_PHP_options();
#start_compression();
#display_errors();

# Check Authorization

require_once ('Library/hbAuth.php');    # Create hbAuth object with login action being the default $_SERVER('PHP_SELF').
$auth = new hbAuth(false,false);        # and do not allow login or registration from the admin page.
if (!$auth->checkAuth())                                    # IF    no authorized login         THEN  ACCESS DENIED.
{ $error = 'You must login from the home page first.'; include 'View/accessdenied.html.php'; exit; }  
if ($auth->getAuthData('role') != 'Administrator')          # IF    role is not Administrator   THEN  ACCESS DENIED.
{ $error = 'Only Administrators may access this page.'; include 'View/accessdenied.html.php'; exit; }
if ($auth->is_idle())                                       # IF    member has been idle too long THEN ACCESS DENIED.
{ $error = 'You have been automatically logged out due to inactivity. Please login again.'; 
  include 'View/accessdenied.html.php'; exit; 
}

# Member editing set up.

require_once 'Library/db.inc.php';
require_once 'Member.php';
require_once 'MemberForm.php';
require_once 'Model/Note.php';
$category = 'Admin';                    # This lets the form handler know what items to present for edit dependent on
                                        # where the edit request is coming from.
                                        # Currently, values = Admin, User (Administrator, Contributor).

#============================================================================================================================
# Event handlers for simple page navigation
#============================================================================================================================
if (isset($_GET['redirect']))   { redirect($_GET['redirect']); exit(); }

#============================================================================================================================
# Event handlers for requests to PRESENT FORMS to:
#
#   Edit    - an existing member.
#============================================================================================================================

# Edit: present a populated form to edit an existing member.

if (isset($_POST['action']) && $_POST['action'] == 'Edit')  { edit_member($_POST['memberID']); }

#============================================================================================================================
# Event handlers to PROCESS SUBMITTED FORMS: editform
#============================================================================================================================

# Editform: process submitted form to edit an existing member.

if (isset($_POST['_qf__editform']))   
{ $form = new MemberForm($category,'editform');       # Get a built form to access submit values
#  if ($form->delete->getValue()) { delete_article($form->articleid->getValue()); }
  
   if (!$form->validate())    { echo "not validate"; exit; } 

  Member::updatetodb_byadmin($form->memberid->getValue(), $form->regrole->getValue(), 
    $form->regrating->getValue(), $form->regfirst->getValue(), $form->reglast->getValue()); 
  header('Location: .'); exit();
}

#============================================================================================================================
# Event handler to delete an existing member
#============================================================================================================================
if (isset($_POST['action']) and $_POST['action'] == 'Delete')       { /*delete_member($_POST['memberID']); */ }

#============================================================================================================================
# edit_member()   -- Get a member by his ID and construct and present an Edit Form for it
#                    (Use the article's category for rendering instructions and the populated article for form contents.)
# delete_member() --
#============================================================================================================================
function edit_member($id)               
{ global $category;

  $member = Member::getbyid($id); 
  $form = new MemberForm($category,'editform',$member);
  start_admin_html(); $form->present_form($member); end_admin_html(); exit;
}

function delete_member($id)    { Note::delete_AllByMember($id); Member::deletebyid($id); header('Location: .'); exit; }


#============================================================================================================================
# Render HTML
#============================================================================================================================

# Manage Members

$hcols = array(                             # Define hb.members columns' headings and titles.
  'username'     => 'Member login name', 
  'role'         => 'Contributor, Editor, Administrator, or UNACTIVATED', 
  'rating'       => 'Member rating',
  'Options'      => 'Edit: member role, rating, first and last name; Delete: remove the member',
  'loginTime'    => 'When the member logged in to his current, active session',
  'idleTime'     => 'When the member session times out',
  'editingTime'  => 'When the Editor switched his session to Editor Mode',
  'reference'    => 'A bookmark: book.chapter.verse.word.scrollTop',
  'notes'        => 'Editor or Administrator notes about the member'
);

start_admin_html(); 
echo "<section class='admin'><h3>Manage Members</h3>";
?>
  <p><ol style="list-style-type:none;">
       <li>Hover over a <i>column heading</i> to see a description of the column data.</li>
       <li>Hover over a <i>username</i> to see any full name, email address, and registration date
           (useful to delete the unactivated).</li></ol></p>
  <?php 
  start_admin_table($hcols);
    list_members(Member::getunactivated(),false);
    list_members(Member::getAllInRole('Administrator'));
    list_members(Member::getAllInRole('Editor'));
    list_members(Member::getAllInRole('Contributor'));
  echo "</table></section>";
end_admin_html('index.php?usePos=usePos');


function list_members($members,$activated=true)                 # List members
{ foreach ($members as $member) 
  { if ($activated && $member->activation != null) continue;    # If list is of activated members, skip any unactivated. 
    $role     = $activated ? $member->role : 'UNACTIVATED';     # If list is of unactived members, role is UNACTIVATED.

    $username = html($member->username);                        # Variables of  convenience.
    $name     = html($member->get_firstlast());
    $regdate  = date('Y-m-j',strtotime($member->registerDate));
    $title    = ' title="'.($name ? "&lt;$name&gt;" : '').html($member->email).' '.$member->friendly_regdate().'"';
    $loginTime   = $member->loginTime   ? date('M-j H:i',strtotime($member->loginTime))   : ''; 
    $idleTime    = ($member->idleTime) ? date('M-j H:i', $member->idleTime) : '';    
    $editingTime = $member->editingTime ? date('M-j H:i',strtotime($member->editingTime)) : '';

    echo "<form action='?' method='post'><tr valign='top'>";
    echo "<td $title>$username</td>";
    echo "<td>". html($role)            . "</td>"; 
    echo "<td>". html($member->rating)  . "</td>"; 
    echo "<td><input type='hidden' name='memberID' value='" . html($member->id) . "'>";
    echo    "<button name='action' value='Edit'   title=\"Edit $username's role and rating.\">Edit</button>";
    echo    "<button name='action' value='Delete' title='Delete $username.'>      Delete</button>";
    echo "</td>";
    echo "<td>$loginTime</td><td>$idleTime</td><td>$editingTime</td>"; 
    echo "<td>". html($member->reference) . "</td>"; 
    echo "<td>". html($member->notes)     . "</td>"; 
    echo "</tr></form>";
  } 
} 

?>

