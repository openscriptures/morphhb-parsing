<?php
#****************************************************************************************************************************
# Member class      -- DB container for a member.
#****************************************************************************************************************************
class Member                            # hb.members table object container.
{ 
public $id;                             # Primary key (unique of course).
public $username, $email;               # Unique keys.
public $password;                       # Not Null. 
public $role;                           # Not Null enum {Contributor, Editor, Administrator}.
public $rating;                         # Not Null (default 0).

public $firstName, $lastName;           # Can be Null
public $reference, $notes;              # Can be Null
public $activation;                     # Must be Null for a registered member.
public $registerDate;                   # Not Null
public $loginTime, $editingTime;        # Can be Null
public $idleTime;                       # Can be Null

private function resetValues($row = null)
{ if ($row == null)
  { $this->id = 0;
    $this->username = $this->email = $this->password = ''; 
    $this->role = 'Contributor';
    $this->rating = 0;

    $this->firstName = $this->lastName = $this->reference = $this->notes = $this->activation = $this->registerDate = null;
    $this->loginTime = $this->editingTime = null;
    $this->idleTime  = 0;
  }
  else
  { $this->id = $row['id']; 
    $this->username   = $row['username'];   $this->email        = $row['email'];    $this->password   = $row['password'];
    $this->role       = $row['role'];       $this->rating       = $row['rating'];
    $this->firstName  = $row['firstName'];  $this->lastName     = $row['lastName'];
    $this->reference  = $row['reference'];  $this->notes        = $row['notes'];    
    $this->activation = $row['activation']; $this->registerDate = $row['registerDate'];
    $this->loginTime  = $row['loginTime'];  $this->editingTime  = $row['editingTime'];
    $this->idleTime   = $row['idleTime']; 
  }
}

function __construct($row = null) { $this->resetValues($row); return; }

public function get_firstlast() 
{ if (!$this->lastName)    return $this->firstName;
  if (!$this->firstName)   return $this->lastName;
  return "$this->firstName $this->lastName";
}

public function friendly_regdate() { return(date('Y-m-j',strtotime($this->registerDate))); }
#============================================================================================================================
# getAllInRole()
#============================================================================================================================
public function getAllInRole($role,$limit=null)
{ global $pdo;

  try
  { $sql  = 'SELECT * FROM members WHERE role = :role ';
    if ($limit != null) $sql .= "LIMIT $limit";
    $sql .= ';';
    $s = $pdo->prepare($sql); $s->bindValue(':role', $role); $s->execute();
  }
  catch (PDOException $e) { fatal("Error fetching $role list: $e"); } 

  $members = array();
  foreach ($s as $row) { $members[] = new Member ($row); }
  return $members;
}

#============================================================================================================================
# getAll()
#============================================================================================================================
public function getAll($limit=null)
{ global $pdo;

  try
  { $sql  = 'SELECT * FROM members ';
    if ($limit != null) $sql .= "LIMIT $limit";
    $sql .= ';';
    $s = $pdo->prepare($sql); $s->execute();
  }
  catch (PDOException $e) { fatal("Error fetching all members list: $e"); } 

  $members = array();
  foreach ($s as $row) { $members[] = new Member ($row); }
  return $members;
}

#============================================================================================================================
# getunactivated()
#============================================================================================================================
public function getunactivated()
{ global $pdo;

  try { $s = $pdo->prepare('SELECT * FROM members WHERE NOT activation="NULL";'); $s->execute(); }
  catch (PDOException $e) { fatal("Error fetching unactivated member details: $e"); }
  
  $members = array();
  foreach ($s as $row) { $members[] = new Member ($row); }
  return $members;
}

#============================================================================================================================
# getbyid()
#============================================================================================================================
public function getbyid($id)
{ global $pdo;

  try { $s = $pdo->prepare('SELECT * FROM members WHERE id = :id'); $s->bindValue(':id', $id); $s->execute(); }
  catch (PDOException $e) { fatal("Error fetching member details by id: $e"); }
  return(new Member($s->fetch()));
}

#============================================================================================================================
# updatetodb_byadmin()
#============================================================================================================================
public function updatetodb_byadmin($id, $role, $rating, $firstName, $lastName)
{ global $pdo;

  try
  { $sql  = 'UPDATE members SET role = :role, rating = :rating, firstName = :firstName, lastName = :lastName ';
    $sql .= 'WHERE id = :id;';
    $s = $pdo->prepare($sql);
    $s->bindValue(':id',        $id);
    $s->bindValue(':role',      $role);
    $s->bindValue(':rating',    $rating);
    $s->bindValue(':firstName', $firstName);
    $s->bindValue(':lastName',  $lastName);
    $s->execute();
  }
  catch (PDOException $e) { fatal("Error updating member to database by Administrator: $e"); }
}
#============================================================================================================================
# deletebyid()
#============================================================================================================================
public function deletebyid($id)
{ global $pdo;

  try { $s = $pdo->prepare('DELETE FROM members WHERE ID = :id;'); $s->bindValue(':id', $id); $s->execute(); }
  catch (PDOException $e) { fatal("Error deleting meber from database: $e"); }
}


} # END CLASS Member

