<?php
require_once('VerseWord.php');
require_once('VerseWordPosition.php');
require_once('Model/Note.php');
require_once('Model/Alert.php');
#****************************************************************************************************************************
# SaveParsing Class -- a validation wrapper for a MorphSubmission class (which is a child class of VerseWordPosition.
#****************************************************************************************************************************
class SaveParsing
{ 
private $morphsub;                                          # MorphSubmission class for a new morph;
public function get_morphsub()                              { return($this->morphsub); }

function __construct($morphsubStr,$memberId)    # Validate and store MorphSubmission string as a MorphSubmission class  
{ if (strlen($morphsubStr) >= 40)                   { echo "MorphSubmission string error: length > 40"; exit; }

  $fields = preg_split("/[.\s]/", $morphsubStr);
  if (count($fields) != 5 )                         { echo "MorphSubmission string error: fields != 5 $morphsubStr"; exit; }
  $this->morphsub = new MorphSubmission($fields[0], $fields[1], $fields[2], $fields[3], $fields[4], $memberId);
}

}  # End Class SaveParsing


#****************************************************************************************************************************
# MorphSubmission class - a Submission to change the morph field of a Verse Word.
#****************************************************************************************************************************
class MorphSubmission extends VerseWordPosition
{
protected $newmorph;            # New morphology to be submitted.
protected $memberId;            # The one who submitted it.

public function get_newmorph()       { return($this->newmorph); }  
public function get_memberId()       { return($this->memberId); }  

function __construct($book, $chapter, $verse, $number, $newmorph, $memberId)
{ $this->newmorph = $newmorph;
  $this->memberId = $memberId;
  parent::__construct($book, $chapter, $verse, $number);
}

#============================================================================================================================
# Morph Submissions to update the VerseWord:
#   verified() -- editor's 'verified' morphology.
#   error()    -- editor sets its status as 'error'.
#   submit()   -- member's or editor's morphology submission. 
#============================================================================================================================
public function verified()                               
{ $vword = new VerseWord($this->get_verseword());                         # Verse Word data object from DB.
  Note::insert($this->newmorph, $vword->get_id(), $this->memberId, true); # Write an Editor's verification note.
  return $vword->set_morph($this->newmorph, 'verified');                  # Set status as 'verified'
}

public function error() { $vword = new VerseWord($this->get_verseword()); return $vword->set_status('error'); }

public function submit()                                # Update the VerseWord (dependent on its status).
{ global $auth;

  $vword = new VerseWord($this->get_verseword());       # Verse Word data object from DB.
  $vwId  = $vword->get_id();                            # Primary key for the Verse Word.
#  $status = ($auth->is_editing()) ? $this->edit_submit($vword) : $this->parse_submit($vword);
  $status = $this->parse_submit($vword);
  if ($status != 'ignored') Note::insert($this->newmorph,$vwId,$this->memberId);  # Write a note for this submission.
  return($status);
}

# Submission made by an editor editing, refresh VerseWord to a 'single' submission (clearing all previous notes).

private function edit_submit($vword)                    # Submission made by an editor while editing.
{ Note::delete_AllInWord($vword->get_id());             # Delete all the VerseWord notes.
  return $vword->set_morph($this->newmorph, 'single'); 
}

# Submission made while parsing, update VerseWord dependent on its current status and return new status.

private function parse_submit($vword)                   
{ $vwId   = $vword->get_id();                           # Primary key for the Verse Word.
  $status = $vword->get_status();                       # Use the Verse Word status to process the submission 
  switch ($status)                                      
  { case 'none': return $vword->set_morph($this->newmorph, 'single');       # 1st morph submission. 
    case 'single':                                      # A single submission has already been made: check for a conflict.
    case 'confirmed':                                   # All member submissions confirmed 1st morph: check for a conflict.
    { $status = ($this->newmorph == $vword->get_morph() ? 'confirmed' : 'conflict');
      $note = Note::get_ByOrderInWord($vwId,1);
      if ($status == 'confirmed' && $this->memberId == $note->memberId)    # IF    the same member is confirming the morph 
        return ('ignored');                                                # THEN  ignore this confirmation totally.
      return $vword->set_status($status);               # Set status as confirming or challenging the 1st morph submission
    }                                                         
    case 'conflict':   # at least one member disapproved 1st morph:  just add a note
    case 'error':      # editor has disapproved: just add a note.
    case 'verified':   # editor has verified: just add a note.             
    default: return($status);
  }
}

} # END CLASS MorphSubmission

?>
