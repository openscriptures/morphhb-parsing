<?php
require_once 'Model/VerseWord.php';
#****************************************************************************************************************************
# Note class      -- DB container for a note.
#****************************************************************************************************************************
class Note                              # hb.notes table object container.
{ 
public $id;                             # Primary key (unique of course).
public $memberId;                       # Unique keys.
public $noteDate;                       # Not Null
public $morph;                          # Not Null
public $noteText;                       # Can be NULL
public $verification;                   # Boolean NOT NULL

private function resetValues($row = null)
{ if ($row == null)
  { $this->id = $this->memberId = 0; 
    $this->noteDate = null;
    $this->morph = $this->noteText = '';
    $this->verification = false;
  }
  else
  { $this->id = $row['id']; 
    $this->memberId     = $row['memberId']; 
    $this->noteDate     = $row['noteDate'];
    $this->morph        = $row['morph'];
    $this->noteText     = $row['note']; 
    $this->verification = $row['verification']; 
  }
}

function __construct($row = null) { $this->resetValues($row); return; }

public function friendly_notedate() { return(date('Y-m-j',strtotime($this->noteDate))); }

#============================================================================================================================
# insert() --  Query to write a note into the hb.notes table and return its ID.
#============================================================================================================================
public function insert($morph, $wordId, $memberId, $verification = false)               
{ global $pdo;
 
  $sql = 'INSERT INTO notes SET memberId=:memberId, morph=:morph, noteDate=:noteDate, verification=:verification;';
  try
  { $s = $pdo->prepare($sql);
    $s->bindValue(':memberId',     $memberId);
    $s->bindValue(':morph',        $morph);
    $s->bindValue(':noteDate',     nowdate());
    $s->bindValue(':verification', $verification);
    $s->execute();                       
  }
  catch (PDOException $e) { echo "Error inserting a new note in the database: $e"; exit; }
  $noteId = $pdo->lastInsertId();

  $sql = 'INSERT INTO wordnote SET wordId=:wordId, noteId=:noteId;';
  try
  { $s = $pdo->prepare($sql);
    $s->bindValue(':wordId',    $wordId);
    $s->bindValue(':noteId',    $noteId);
    $s->execute();                       
  }
  catch (PDOException $e) { echo "Error inserting a new wordnote in the database: $e"; exit; }
  
  return $noteId;
}

#============================================================================================================================
# getbyid()
# get_AllInWord()
# get_ByOrderInWord()
# get_AllByMember()
#============================================================================================================================
public function getbyid($id)
{ global $pdo;

  try { $s = $pdo->prepare('SELECT * FROM notes WHERE id = :id'); $s->bindValue(':id', $id); $s->execute(); }
  catch (PDOException $e) { fatal("Error fetching note details by id: $e"); }
  return(new Note($s->fetch()));
}

public function get_AllInWord($wordId)
{ global $pdo;

  try
  { $sql  = 'SELECT * FROM notes INNER JOIN wordnote ON id = noteId WHERE wordId=:wordId ';
    $sql .= 'ORDER BY verification DESC, noteDate ASC;';
    $s = $pdo->prepare($sql); $s->bindValue(':wordId', $wordId); $s->execute();
  }
  catch (PDOException $e) { echo "Error fetching notes for word: $e"; exit; } 

  $notes = array();
  foreach ($s as $row) { $notes[] = new Note ($row); }
  return $notes;
}

public function get_ByOrderInWord($wordId, $pos=1) 
{ $notes = Note::get_AllInWord($wordId);
  $count = 1;
  foreach ($notes as $note) { if ($count == $pos) return($note); ++$count; }
  echo "Error note $pos for wordId=$wordId not found in database!"; exit; 
} 

public function get_AllByMember($memberId)
{ global $pdo;

  try
  { $sql  = 'SELECT * FROM notes WHERE memberId=:memberId ';
    $s = $pdo->prepare($sql); $s->bindValue(':memberId', $memberId); $s->execute();
  }
  catch (PDOException $e) { echo "Error fetching notes by member: $e"; exit; } 

  $notes = array();
  foreach ($s as $row) { $notes[] = new Note ($row); }
  return $notes;
}

#============================================================================================================================
# delete_this() --  Query to delete a note from the hb.notes table.
# delete_AllInWord()
#============================================================================================================================
public function delete_this()               
{ global $pdo;
  
  $id = $this->id; 
  $vw = VerseWord::getby_noteId($id);       # THIS MUST BE FIRST because below we delete wordnotes and notes.

  try 
  { $sql = 'DELETE FROM wordnote WHERE noteID = :id';
    $s = $pdo->prepare($sql); $s->bindValue(':id',  $id); $s->execute(); 
  }
  catch (PDOException $e) { echo "Error deleting wordnote from the database: $e"; exit; }

  try 
  { $sql = 'DELETE FROM notes WHERE id = :id';
    $s = $pdo->prepare($sql); $s->bindValue(':id',  $id); $s->execute(); 
  }
  catch (PDOException $e) { echo "Error deleting note from database: $e"; exit; }

  $vw->update_FromNotes();
}

public function delete_AllInWord($wordId)
{ global $pdo;

  $notes = Note::get_AllInWord($wordId);
  foreach ($notes as $note) $note->delete_this();
}

public function delete_AllByMember($memberId)
{ global $pdo;

  $notes = Note::get_AllByMember($memberId);
  foreach ($notes as $note) $note->delete_this();
}

} # END CLASS Member

