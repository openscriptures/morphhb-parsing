<?php
#****************************************************************************************************************************
# Alert class      -- DB container for a chapter alert (status: open, changed, closed).
#****************************************************************************************************************************
class Alert                             # hb.alerts table object container.
{ 
public $id;                             # Primary key (unique of course).
public $bookId;                         # Unique key.
public $chapter;                        # Not Null
public $status;                         # ENUM { open, changed, closed} Not Null

private function resetValues($row = null)
{ if ($row == null)
  { $this->id = $this->bookId = $this->chapter = null; 
    $this->status = 'open';
  }
  else
  { $this->id       = $row['id']; 
    $this->bookId   = $row['bookId']; 
    $this->chapter  = $row['chapter'];
    $this->status   = $row['status'];
  }
}

function __construct($row = null) { $this->resetValues($row); return; }

function get_by_ref($bookId, $chapter)
{ global $pdo;

  try
  { $sql = 'SELECT * FROM alerts WHERE bookId=:bookId AND chapter=:chapter;';
    $s = $pdo->prepare($sql);
    $s->bindValue(':bookId',  $bookId); 
    $s->bindValue(':chapter', $chapter); 
    $s->execute();
  }
  catch (PDOException $e) { return false; }
  return (new Alert($s->fetch()));
}
#============================================================================================================================
# getbystatus()
#============================================================================================================================
public function getbystatus($status)
{ global $pdo;

  try { $s = $pdo->prepare('SELECT * FROM alerts WHERE status = :status'); $s->bindValue(':status',$status); $s->execute(); }
  catch (PDOException $e) { fatal ("Error fetching alert details by status: $e"); }
   
  $alerts = array();
  foreach ($s as $row) { $alerts[] = new Alert ($row); }
  return $alerts;
}
#============================================================================================================================
# getbyid()
#============================================================================================================================
#public function getbyid($id)
#{ global $pdo;
#
#  try { $s = $pdo->prepare('SELECT * FROM members WHERE id = :id'); $s->bindValue(':id', $id); $s->execute(); }
#  catch (PDOException $e) { fatal("Error fetching member details by id: $e"); }
#  return(new Member($s->fetch()));
#}

#============================================================================================================================
# update() -- Query to update a chapter alert's status.
#============================================================================================================================
public function update($status, $bookId, $chapter) 
{ global $pdo;
#  echo "HOWDY got here: $status, $bookId, $chapter";
  try
  { $sql  = 'UPDATE alerts SET status=:status WHERE bookId=:bookId AND chapter=:chapter;';
    $s = $pdo->prepare($sql); 
    $s->bindValue(':status',  $status); 
    $s->bindValue(':bookId',  $bookId); 
    $s->bindValue(':chapter', $chapter);
    $s->execute();
  }
  catch (PDOException $e) { echo "Error updating status '$status' for alert $bookId.$chapter : $e"; exit; }
  return($status);
}

#============================================================================================================================
# insert() -- USED ONLY BY CLI to rebuild all alerts (after accidentally wiping them out).
#============================================================================================================================
public function insert($bookId, $chapter) 
{ global $pdo;

  try
  { $sql  = 'INSERT INTO alerts SET status="open", bookId=:bookId, chapter=:chapter;';
    $s = $pdo->prepare($sql); 
    $s->bindValue(':bookId',  $bookId); 
    $s->bindValue(':chapter', $chapter);
    $s->execute();
  }
  catch (PDOException $e) { echo "Error inserting alert $bookId.$chapter : $e"; exit; }
}


#============================================================================================================================
# getAllInRole()
#============================================================================================================================
#public function getAllInRole($role,$limit=null)
#{ global $pdo;
#
#  try
#  { $sql  = 'SELECT * FROM members WHERE role = :role ';
#    if ($limit != null) $sql .= "LIMIT $limit";
#    $sql .= ';';
#    $s = $pdo->prepare($sql); $s->bindValue(':role', $role); $s->execute();
#  }
#  catch (PDOException $e) { fatal("Error fetching $role list: $e"); } 
#
#  $members = array();
#  foreach ($s as $row) { $members[] = new Member ($row); }
#  return $members;
#}

#============================================================================================================================
# getAll()
#============================================================================================================================
#public function getAll($limit=null)
#{ global $pdo;
#
#  try
#  { $sql  = 'SELECT * FROM members ';
#    if ($limit != null) $sql .= "LIMIT $limit";
#    $sql .= ';';
#    $s = $pdo->prepare($sql); $s->execute();
#  }
#  catch (PDOException $e) { fatal("Error fetching all members list: $e"); } 
#
#  $members = array();
#  foreach ($s as $row) { $members[] = new Member ($row); }
#  return $members;
#}

#============================================================================================================================
# getbyid()
#============================================================================================================================
#public function getbyid($id)
#{ global $pdo;
#
#  try { $s = $pdo->prepare('SELECT * FROM members WHERE id = :id'); $s->bindValue(':id', $id); $s->execute(); }
#  catch (PDOException $e) { fatal("Error fetching member details by id: $e"); }
#  return(new Member($s->fetch()));
#}

#============================================================================================================================
# updatetodb_byadmin()
#============================================================================================================================
#public function updatetodb_byadmin($id, $role, $rating, $firstName, $lastName)
#{ global $pdo;
#
#  try
#  { $sql  = 'UPDATE members SET role = :role, rating = :rating, firstName = :firstName, lastName = :lastName ';
#    $sql .= 'WHERE id = :id;';
#    $s = $pdo->prepare($sql);
#    $s->bindValue(':id',        $id);
#    $s->bindValue(':role',      $role);
#    $s->bindValue(':rating',    $rating);
#    $s->bindValue(':firstName', $firstName);
#    $s->bindValue(':lastName',  $lastName);
#    $s->execute();
#  }
#  catch (PDOException $e) { fatal("Error updating member to database by Administrator: $e"); }
#}
#============================================================================================================================
# deletebyid()
#============================================================================================================================
#public function deletebyid($id)
#{ global $pdo;
#
#  $member = Member::getbyid($id);
#  $oldimage = $article->image;
#
#  try { $s = $pdo->prepare('DELETE FROM article WHERE ID = :id;'); $s->bindValue(':id', $id); $s->execute(); }
#  catch (PDOException $e) { fatal("Error deleting article from database: $e"); }
#
#  $article->delete_thumb($id,$oldimage);
#}


} # END CLASS Member

