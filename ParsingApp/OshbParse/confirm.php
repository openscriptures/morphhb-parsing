<?php
require_once 'Library/configure_PHP.inc.php'; 
require_once 'Library/db.inc.php';                  # PDO database connection.
require_once 'View/templates.html.php'; 
#============================================================================================================================
# confirm.php - confirm a signup against the confirmation code. If it matches, confirm the member and let him log in.
#============================================================================================================================
$email      = isset($_GET['email'])      ? $_GET['email']      : ''; 
$activation = isset($_GET['activation']) ? $_GET['activation'] : '';

if (!($email && $activation)) { display_error ('Invalid URL argumentss');  exit; }

try
{ $sql = "SELECT * FROM members WHERE activation=:activation";
  $s = $pdo->prepare($sql); $s->bindParam(':activation', $activation); $s->execute();
  $row = $s->fetchAll(PDO::FETCH_ASSOC);
}
catch (PDOException $e) { display_error ('Database error when looking for confirmation code: '.$e->getMessage());  exit; }
if (count($row) != 1)   
{ try
  { $sql = "SELECT * FROM members WHERE email=:email";
    $s = $pdo->prepare($sql); $s->bindParam(':email', $email); $s->execute();
    $row = $s->fetchAll(PDO::FETCH_ASSOC);
  }
  catch (PDOException $e) { display_error ('Database error when looking for email: '.$e->getMessage());  exit; }
  if (count($row) == 1 && $row['activation'] == null)   already_authorized(); 
  else display_error (count($row) . " records found for confirmation code: $activation");  
  exit; 
}

if ($row[0]['email'] != $email) { display_error ("Email doesn't match registered email address");  exit; }   

try                                                       # Confirm the user.
{ $sql = "UPDATE members SET activation=NULL WHERE activation=:activation LIMIT 1"; 
  $s = $pdo->prepare($sql); $s->bindParam(':activation', $activation); $s->execute();   
}
catch (PDOException $e) { display_error ('Database error when confirming user: '.$e->getMessage());  exit; }

start_html(); ?>
<section>
  <form><h3>Confirmation Successful</h3>
    <p>Thank you. Your account has now been confirmed.</p>
    <p> You can now <a href="index.php">login</a></p>'
  </form>
</section>
</body>
</html>

<?php
function already_authorized()
{ start_html(); ?>
  <section>
  <form><h3>Confirmation Successful</h3>
    <p>Thank you. Your account has already been confirmed.</p>
    <p> You can now <a href="index.php">login</a></p>'
  </form>
  </section>
  </body>
  </html>
<?php
}

function display_error($error)
{ start_html(); ?>
  <section>
  <form><h3>Confirmation Problem</h3>
    <p>There was a problem confirming your account: <?php echo $error; ?></p>
    <p>Please try again or contact the site administrators.</p>
  </form>
  </section>
  </body>
  </html>
<?php
}
 
