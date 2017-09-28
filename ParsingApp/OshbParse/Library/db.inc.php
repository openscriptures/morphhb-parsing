<?php
function fatal($err)    { $error = $err; include 'View/scripterror.html.php'; exit; }   # Fatal error on browser request
function get_dbname()   { return reset(explode('.', $_SERVER['SERVER_NAME'])); }        # returns 'hb' or 'hbdev';
try
{ $pdo = new PDO('mysql:host=localhost; dbname='.get_dbname(), ini_get('mysql.default_user'), 
                                                               ini_get('mysql.default_password'));
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->exec('SET NAMES "utf8"');
}
catch (PDOException $e) { fatal("Unable to connect to the database server."); }  # DO NOT POST $e (it has password)

#============================================================================================================================
# EXAMPLES
#============================================================================================================================
#============================================================================================================================
# MemberHasRole()
#============================================================================================================================
#function MemberHasRole($email,$role)
#{ global $pdo;
#  try
#  { $sql = "SELECT COUNT(*) FROM member
#        INNER JOIN memberrole ON member.ID = memberID
#        INNER JOIN role ON roleID = role.ID
#        WHERE Email = :email AND role.ID = :roleid";
#    $s = $pdo->prepare($sql); $s->bindValue(':email', $email); $s->bindValue(':roleid', $role); $s->execute();
#  }
#  catch (PDOException $e) { $error = 'Error searching for author roles. '.$e; include 'library/scripterror.html'; exit(); }
#
#  $row = $s->fetch();
#
#  if ($row[0] > 0)  { return TRUE; }
#  else              { return FALSE; }
#}

#============================================================================================================================
# getCategoryID()
#============================================================================================================================
#function getCategoryID($category)
#{ global $pdo;
#
#  try   { $s = $pdo->prepare('SELECT * FROM category;'); $s->execute(); }
#  catch (PDOException $e)  { $error = "Error fetching categories to get ID. ".$e; include 'library/scripterror.html'; exit;}
#  
#  $categoryID = 0;
#  foreach ($s as $row)     { if ($row['Name'] == $category) { $categoryID = $row['ID']; break; } }
#  if (!$categoryID)        { $error = "Error category not found. "; include 'library/scripterror.html'; exit; }
#  return($categoryID);
#}
#
