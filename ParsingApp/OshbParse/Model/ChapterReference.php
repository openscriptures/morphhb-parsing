<?php
require_once 'Library/db.inc.php';
require_once 'Model/Books.php';
require_once 'Model/Alert.php';
#****************************************************************************************************************************
# ChapterReference class -- container for a chapter reference.
#****************************************************************************************************************************
class ChapterReference
{ 
public    $refstr;                              # Chapter reference string  (e.g. Gen.1).
public    $book;                                # Book sbl                  (e.g. Gen)
public    $chapter;                             # Chapter integer value.

public    $bookId;                              # Book    integer value.
public    $bookOT;                              # Book    full name         (e.g. Genesis)
public    $fullname;                            # Chapter full name         (e.g. Genesis 1)

public function get_alert_status()
{ $alert = Alert::get_by_ref($this->bookId, $this->chapter); return ($alert ? $alert->status : 'error: no alert'); }

public function versewordref($verse, $word, $scrollTop = 0)              # Build & return a full VerseWord reference string. 
{ $sep='.'; return($this->refstr.$sep.$verse.$sep.$word.$sep.$scrollTop); } 

public function get_vwid($verse, $word)                                 # Build & return a VerseWord ID string. 
{ $sep='.'; return($this->refstr.$sep.$verse.$sep.$word); } 

public function get_ChapterReference($bookId,$verse)      # Build and return a ChapterReference object from integer values
{ return new ChapterReference(array_search($bookId, Books::$num).".$verse"); }

public function __construct($refstr) 
{ $this->refstr = $refstr; 
  $fields = explode('.', $refstr);
  if ( (strlen($refstr) >= 8) || (count($fields) !=2)  )    { echo "Error bad chapter reference: $refstr"; exit; }

  $this->book     = $book = $fields[0];
  $this->chapter  = $fields[1]; 
  $this->bookId   = Books::$num[$book]; 
  $this->bookOT   = Books::$ot[$book]; 
  $this->fullname = $this->bookOT . ' ' . $this->chapter; 
}

#============================================================================================================================
# Queries
#============================================================================================================================
public function get_chapterwords()
{ global $pdo;
  
  $sql = 'SELECT * FROM words WHERE (bookId=:bookId AND chapter=:chapter);';
  try
  { $s = $pdo->prepare($sql);
    $s->bindValue(':bookId',  $this->bookId);
    $s->bindValue(':chapter', $this->chapter);
    $s->execute();
  }
  catch (PDOException $e) { echo "Error fetching a chapter's words: $e"; exit; }
  return($s);
}


} # END class ChapterReference


?>
