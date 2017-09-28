<?php
require_once 'Model/Books.php';
#****************************************************************************************************************************
# VerseWordPosition class - a reference to a Verse Word by Word Position in a Source Text.
#
# Though chapters and verses start with index 1, number starts with index 0;
#****************************************************************************************************************************
class VerseWordPosition
{
public $book;            # Book sbl id (e.g. Gen);
public $bookId;          # Integers that reference a VerseWord's position in the source text used for DB access.        
public $chapter;         # "
public $verse;           # "
public $number;          # " (number in verse, not position in chapter);
public $scrollTop;       # Scroll position on page (if given)

public function get_chap_refstr()  { return ($this->book.'.'.$this->chapter); }
public function get_refstr()   
{ $sep = '.'; return($this->book.$sep.$this->chapter.$sep.$this->verse.$sep.$this->number.$sep.$this->scrollTop); }

public function get_VerseWordPosition($refstr)     # refstr is a VerseWordPosition reference string (as above).
{ $fields = explode('.', $refstr);
#  echo $refstr; exit;
  $pos = count($fields) < 5 ? null : $fields[4];
  return(new VerseWordPosition($fields[0], $fields[1], $fields[2], $fields[3], $pos)); 
}

function __construct($book, $chapter, $verse, $number, $scrollTop=0)
{ $this->book       = $book;
  $this->bookId     = Books::$num[$book];
  $this->chapter    = $chapter;
  $this->verse      = $verse;
  $this->number     = $number;
  $this->scrollTop  = $scrollTop;
}

#============================================================================================================================
# get_verseword() -- Query for the data about a single word in a verse from hb.words table.
#============================================================================================================================
public function get_verseword()          
{ global $pdo;
        
  try
  { $sql  = 'SELECT * FROM words WHERE (bookId=:bookId AND chapter=:chapter AND verse=:verse AND number=:number)';
    $s = $pdo->prepare($sql); 
    $s->bindValue(':bookId' , $this->bookId);
    $s->bindValue(':chapter', $this->chapter);
    $s->bindValue(':verse',   $this->verse);
    $s->bindValue(':number',  $this->number);
    $s->execute();
  }
  catch (PDOException $e) { echo "Error retrieving verseword from words table in database: $e"; exit; }
  return $s->fetch();
}

#============================================================================================================================
# get_position_in_chapter()
#============================================================================================================================
public function get_position_in_chapter()          
{ global $pdo;
  
  if ($this->verse == 1) return($this->number);     
  try
  { $sql  = 'SELECT COUNT(id) FROM words WHERE (bookId=:bookId AND chapter=:chapter AND verse<:verse)';
    $s = $pdo->prepare($sql); 
    $s->bindValue(':bookId' , $this->bookId);
    $s->bindValue(':chapter', $this->chapter);
    $s->bindValue(':verse',   $this->verse);
    $s->execute();
  }
  catch (PDOException $e) { echo "Error finding word position in chapter from words table in database: $e"; exit; }
  $row = $s->fetch();
  return ($row['COUNT(id)'] + $this->number);
}


} # END CLASS VerseWordPosition

?>
