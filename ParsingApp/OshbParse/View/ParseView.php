<?php
$book      = $refpos->book;                     # Variables of convenience
$bookId    = $refpos->bookId;
$chapter   = $refpos->chapter;
$scrollTop = $refpos->scrollTop;
$startword = $refpos->get_position_in_chapter();
#print_r($refpos); echo $startword;
#echo("$book.$bookId.$chapter.$startword.$scrollTop");

require_once 'Model/Alert.php'; 
$alert = Alert::get_by_ref($bookId, $chapter); 

?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OSHB Parsing</title>
  <link rel="stylesheet" href="Style/OshbStyle.css" />
  <link rel="shortcut icon" href="Image/OSHB.ico" />
  <!--[if IE]>
  <script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->
</head>
<body>
<header><h1><span class="logo"><span>The OpenScriptures</span><br />Hebrew Bible</span> – Parsing</h1></header>

<?php
#****************************************************************************************************************************
# Navigation. 
#****************************************************************************************************************************
echo '<nav><form>';

# Chapter Select Panel. 

  label('book', 'Select a book', 'Book');                                   # select: Book
  echo "<select id='book' name='book' title='Select a book'>";   
  foreach (Books::$ot as $sbl => $name) 
  { $selected = ($sbl == $book ? ' selected="selected"' : ''); 
    echo "<option value=\"$sbl\"$selected>$name</option>"; 
  } 
  echo '</select>';

  label('chapter', 'Select a chapter', 'Chapter');                          # select: Chapter
  echo "<select id='chapter' name='chapter' title='Select a chapter'><option value='$chapter'>$chapter</option></select>";

  input_hidden('startword', 'startword', $startword);   # hidden $_GET inputs: startword, scrolltop
  input_hidden('scrollTop', 'scrollTop', $scrollTop);   # (for javascript use only to return to reference bookmark).
  if ($usePos)                                          # activates the above.
   input_hidden('usePos', 'usePos', 'usePos');

  button('select', 'Select this reference and view the chapter', 'Select'); # button: select

# Alert Status Span. 

  echo '<span id="alertstatus" title="Viewed chapter status: open, changed, closed">status: '.$alert->status.'</span>';

# Personal Panel

  personal_panel($alert); 

# About/Help links
?> 
  <a href="View/about.html.php" target="_blank" title="About Open Scriptures Hebrew Bible Parsing">About</a>
  <a href="View/OshbHelp.html" target="_blank" title="Help page for Open Scriptures Hebrew Bible Parsing">Help</a>
</form></nav>

<?php
#****************************************************************************************************************************
# Main - The Parser
#****************************************************************************************************************************
echo '<section id="parser">';

#============================================================================================================================
# Panel Section
#============================================================================================================================
echo '<section id="panel">';                  
?>
    <article id="text"></article>                               <?php # Article: Chapter Markup Text. ?>    
    <div id="explain">                                          <?php # Explanation box for selected word morph. ?>
      <h2>Explanation</h2>
      <div id="morphText"></div>                                <?php # Actual explanation for the word. ?>
    </div>
    <div id="colorkey">                                         <?php # Color key for word statuses. ?>
      <h2>Word Status Color Key</h2>
      <?php if ($auth->is_editing()): ?>
      <span class='verified'>verified</span>
      <span class='error'>error</span>
      <span class='conflict'>conflict</span>
      <span class='confirmed'>confirmed</span>
      <span class='single'>single</span>
      <?php else: ?>
      <span class='verified'>verified</span>
      <span class='done'>done</span>
      <?php endif; ?>
      <span class='current'>current</span>
    </div>
  </section>

<?php
#============================================================================================================================
# Word Section
#============================================================================================================================
  echo '<section id="word">';
  button('foreWord', 'Next word', '&lt;', 'move');                  # Word span and it's nav elements.
  echo '<span id="wordBox">&nbsp;</span>';
  button('backWord', 'Previous word', '&gt;', 'move');
  echo '</br>';

  function widget_wordstatus()                                      # wordstatus (span)
  { echo '<span id="wordstatus" ';                                  
    echo 'title="Viewed word status: none, single, conflict, error, confirmed, verified">';
    echo 'conflict</span>';
  }
  function widget_editormorph()                                     # editormorph (select: list of submitted morphologies)
  { #echo '<input type="text" id="editormorph" />';
     echo "<select id='editormorph' name='editormorph' title='List of submitted morphologies'>";
     echo "<option value='1st morph'>1st morph (stub)</option>";   
     echo "<option value='2nd morph'>2nd morph (stub)</option>";   
     echo "<option value='etc'>etc. ...</option>";   
     echo "</select>";
  }
       
  if ($auth->is_editing())                                          # Editor Word Panel
  { widget_wordstatus(); echo '</br>';
    button('verify_button', 'Verify morphology', 'Verify');              #   Verify
    widget_editormorph();
    button('error_button',  'Morphology is wrong, flag for editing',     'Error');
####    button('edit_button',   'Edit parsing',     'Edit');
    button('notes_button', 'View notes on morphology submissions for this word in detail',  'Notes');
    echo '</br>';
  }
  else { widget_editormorph(); echo '</br>'; }

  label('morph', '', 'Morphology');                                 # Morphology input form 
  echo '<input type="text" id="morph" />';
  button('apply', 'Submit this morphology to the database', 'Apply');
  echo '</section>';
  
#============================================================================================================================
# Morph Hint Box
#============================================================================================================================
  echo '<div id="morphHint"></div>';

#============================================================================================================================
# Language Box
#============================================================================================================================
  echo '<div id="langSet"><h3>Language</h3>';
  echo '<input type="radio" name="lang" id="heb" checked="checked" />';     label('heb','','Hebrew');
  echo '<br />';
  echo '<input type="radio" name="lang" id="arc" />';                       label('arc','','Aramaic');
  echo '</div>';

#============================================================================================================================
# END MAIN AND HTML
#============================================================================================================================
#echo "<span id='startword' style='visibility: hidden;' value='$startword'></span>";   # hidden $_GET inputs: startword, scrolltop
#echo "<span id='scrollTop' style='visibility: hidden;' value='$scrollTop'></span>";   # (for javascript use only to return to reference bookmark).
?>
</section>
<script src="Script/Parsing.js"></script>
<script src="Script/sitenav.js"></script>
</body>
</html>

<?php 
#============================================================================================================================
# personal_panel()
#============================================================================================================================
function personal_panel($alert)
{ global $auth;

  echo '<span id="personal_panel" style="margin-left: 2em;">';
  echo '<span title="Your login name">'.$auth->getUserName().'</span>'; 
  button('logout_button', 'Log out.', 'Log Out');
  $role = $auth->getAuthData('role'); 
  if ($role == 'Administrator')          button('admin_button',  'Go to the Administrator\'s page.',             'Admin');
  if ($auth->can_edit()) 
  { if (!$auth->is_editing())            button('editor_button', 'Start editing.',                               'Edit');
    else 
    {                                    button('stoped_button', 'Stop editing and start parsing.',              'Parse');
                                         button('alerts_button', 'View alerts for "changed" chapters.',          'Alerts');
    if      ($alert->status == 'open')   button('close_button',  'Close this chapter to any new submissions.',   'Close');
    else if ($alert->status == 'closed') button('open_button',   'Open this chapter to new submissions.',        'Open');
    }
  } 
  echo '</span>';
}
?>
