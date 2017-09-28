<?php
require_once 'HTML/QuickForm2.php';
require_once 'Member.php';              # DB container for a member.

#include_once 'library/helpers.inc.php'; 
#include_once 'view/templates.html.php';
#****************************************************************************************************************************
# MemberForm class -- build a form to present for editing an existing member.
#****************************************************************************************************************************
class MemberForm extends HTML_QuickForm2
{ 
public  $regrole, $regrating, $regfirst, $reglast;


private $category, $action;

private $options = array( 
  "Admin"       => array ("caption" => "Member",       "page" => "home"),
  "User"        => array ("caption" => "Member",       "page" => "home")
);

#============================================================================================================================
# construct the form
#============================================================================================================================
function __construct($category, $action, $member=null)
{ parent::__construct($action,'post'); 

  $this->category = $category; 
  $this->action   = $action;
  $catopts = $this->options[$category];

  if ($member != null && $member->activation != null)
  { $this->regrole   = $this->addSelect('regrole', array('style' => 'width:11em', 'disabled'))->setLabel('Role');
    $this->regrole->addOption('UNACTIVATED','UNACTIVATED','selected');
  }
  else
  { 
    $this->regrole   = $this->addSelect('regrole', array('style' => 'width:11em'))->setLabel('Role');
    $roles = array ('Contributor', 'Editor', 'Administrator');
    foreach ($roles as $role)
    { $selected = ($member == null || $member->role != $role) ? '' : 'selected';
      $this->regrole->addOption($role,$role,$selected);
    }

    $this->regrating   = $this->addSelect('regrating', array('style' => 'width:11em'))->setLabel('Rating');
    for ($rating = 0; $rating < 10; ++$rating)
    {   $selected = ($member == null || $member->rating != $rating) ? '' : 'selected';
      $this->regrating->addOption($rating,$rating,$selected);
    }
  }
  $this->regfirst  = $this->addText('regfirst', array())->setLabel('First Name');
  $this->reglast   = $this->addText('reglast',  array())->setLabel('Last Name');

  $this->memberid = $this->addElement('hidden','id');                                 # Hidden:  member ID
  if ($member!=null)
    $this->memberid->setValue($member->id);

  $delmember = ($member != null) ? $member->username : 'member';
  $this->delete   = $this->addElement('checkbox','Delete')->setLabel("Check here to delete $delmember :");
  if ($member!=null)
  { $this->regfirst->setValue($member->firstName);
    $this->reglast->setValue($member->lastName);
   }

  $button = "Update " . $catopts["caption"];
  $this->addSubmit('submit', array('value' => $button));
  
  $this->addRecursiveFilter('trim');
}

#============================================================================================================================
# present_form() - present the form.
#============================================================================================================================
public function present_form($member = null)
{ global $auth;
  
  $catopts = $this->options[$this->category];
  switch ($this->action)
  { #case "addform":     $pageTitle = "New "; break;
    #case "changeimage": $pageTitle = "Change Image for "; break;
    default:            $pageTitle = "Edit "; break;
  }
  $pageTitle = $pageTitle . $catopts["caption"];
?>
  <section class="admin">
    <h3><?php htmlout($pageTitle); ?></h3> 
    <table>
      <tr>
        <td><?php echo (html("$member->username $member->email ") . $member->friendly_regdate()); ?></td>
        <td><?php htmlout($member->reference);  ?></td> 
        <td><?php htmlout($member->notes);      ?></td> 

      </tr>
    </table>
  </section>
  <section><?php echo $this; ?> </section>
<?php 
} 

} # End class ArticleForm

?>
