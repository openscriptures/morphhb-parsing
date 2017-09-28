<?php
require_once 'Model/Alert.php';
require_once 'Model/Note.php';
#****************************************************************************************************************************
# VerseWord class -- hb database data container for words table objects (stored data for a single word from a verse).
#****************************************************************************************************************************
class VerseWord
{                       # From MySQL query: explain hb.words;
protected $id;                                  # NOT NULL, Primary key. 
protected $bookId, $chapter, $verse, $number;   # NOT NULL, integers that reference Word Position in source text.

protected $word;                                # NOT NULL, Hebrew spelling.
protected $append;                              #           Punctuation
protected $lemma;                               # NOT NULL.
protected $morph;
protected $wordtype;    # NOT NULL: (field label = wordtype) enum('word', 'ketiv', 'qere', 'seg')

protected $status;      # NOT NULL: enum('none', 'single', 'conflict', 'error', 'confirmed', 'verified')

function get_id()           { return($this->id); }      # Get Primary Key.      
function get_bookId()       { return($this->bookId); }  # Get Word Postition component.
function get_chapter()      { return($this->chapter); } # "
function get_verse()        { return($this->verse); }   # "
function get_number()       { return($this->number); }  # "

function get_word()         { return($this->word); }    
function get_append()       { return($this->append); }
function get_lemma()        { return($this->lemma); }
function get_morph()        { return($this->morph); }
function get_wordtype()     { return($this->wordtype); }

function get_status()       { return($this->status); }

function __construct($vw) # array containing the fields of an hb.words table record (for a single word from a verse).
{ $this->id         = $vw['id']; 
  $this->bookId     = $vw['bookId'];
  $this->chapter    = $vw['chapter'];
  $this->verse      = $vw['verse'];
  $this->number     = $vw['number'];

  $this->word       = $vw['word'];
  $this->append     = $vw['append'];
  $this->lemma      = $vw['lemma'];
  $this->morph      = $vw['morph'];
  $this->wordtype   = $vw['wordtype'];

  $this->status     = $vw['status'];
} 
#============================================================================================================================
# getbyid()
# getby_noteId()
#============================================================================================================================
public function getbyid($id)
{ global $pdo;

  try { $s = $pdo->prepare('SELECT * FROM words WHERE id = :id'); $s->bindValue(':id', $id); $s->execute(); }
  catch (PDOException $e) { fatal("Error fetching word details by id: $e"); }
  return(new VerseWord($s->fetch()));
}

public function getby_noteId($id)
{ global $pdo;

  try
  { $sql  = 'SELECT * FROM words INNER JOIN wordnote ON id = wordId WHERE noteId=:noteId ';
    $s = $pdo->prepare($sql); $s->bindValue(':noteId', $id); $s->execute();
  }
  catch (PDOException $e) { echo "Error fetching word for note: $e"; exit; } 
  return(new VerseWord($s->fetch()));
}

#============================================================================================================================
# set_status()
#============================================================================================================================
public function set_status($status) 
{ global $pdo;
    
  $sql  = 'UPDATE words SET status=:status WHERE id=:id;';
  try
  { $s = $pdo->prepare($sql);
    $s->bindValue(':status',  $status);
    $s->bindValue(':id',      $this->id);
    $s->execute();                                             # Update the word's status in the hb.words table.
  }
  catch (PDOException $e) { echo "Error setting status $status for word $this->id to database: $e"; exit; }
  $this->status = $status;
  Alert::update('changed', $this->bookId, $this->chapter);  # Set alert status 'changed' for this chapter in hb.alerts table.
  return $status;
}

#============================================================================================================================
# set_morph()
#============================================================================================================================
public function set_morph($morph, $status)            
{ global $pdo;
  
  $sql  = 'UPDATE words SET morph=:morph, status=:status WHERE id=:id;';
  try
  { $s = $pdo->prepare($sql);
    $s->bindValue(':morph',   $morph);
    $s->bindValue(':status',  $status);
    $s->bindValue(':id',      $this->id);
    $s->execute();                                             # Update the word's morph and status in the hb.words table.
  }
  catch (PDOException $e) { echo "Error setting a word's morph to database: $e"; exit; }
  if ($status != 'verified' && $status != 'none') 
    Alert::update('changed', $this->bookId, $this->chapter);  # Set status 'changed' for chapter in hb.alerts table
  return $status;
}

#============================================================================================================================
# update_FromNotes()
#============================================================================================================================
public function update_FromNotes($ignore_error = false)            
{
  if (!$ignore_error && $this->status == 'error') return 'error';

  $notes = Note::get_AllInWord($this->id);  $morph  = '';          $status = 'none';
  if (count($notes))
    foreach ($notes as $note)
    { if      ($note->verification)       { $morph = $note->morph; $status = 'verified';  break; }
      if      ($status == 'none')         { $morph = $note->morph; $status = 'single';    }
      else if ($morph == $note->morph)    {                        $status = 'confirmed'; }
      else                                {                        $status = 'conflict';  break; } 
    }
  $this->morph = $morph; $this->status = $status;       
  return $this->set_morph($morph, $status);
}

}   # End Class VerseWord

?>
