<?php 
require_once 'Auth.php';                    # PEAR::Auth class
require_once 'Library/helpers.inc.php';     # common html formatting.
require_once 'View/templates.html.php';     # Oshb site utilities for html rendering.
require_once 'Library/Register.php';        # Display/validate a registration form.
require_once 'Library/db.inc.php';          # PDO to the database.

#****************************************************************************************************************************
# hbAuth class -- authorization for OshbParse using PEAR::Auth and hb.members table to control access. 
#
# SHA1() is used to encrypt the passwords.
# It selects every column from the table, making all the previously stored data available.
#****************************************************************************************************************************
class hbAuth extends Auth
{
#============================================================================================================================
# Account registration configuration and activation and activation status.
#============================================================================================================================
private $allow_reg = true;                                      # Allow registrations from the login page.
public function set_allow_reg($value) { $this->allow_reg = $value; }
private $not_activated = false;                                 # User has not activated his account by email if true.

#============================================================================================================================
# Login configuration, event handling, and info.
#============================================================================================================================
private $login_action;                                                                      # Login action.
public function set_login_action($login_action)  { $this->login_action = $login_action; }

private $login_error   = false;                                                             # Login error flag.
public function login_failed()              { $this->login_error = true; }                  # Login failed callback.
public function logged_in($username,$auth)  { $this->set_loginTime(nowdate()); }            # Login  successfull callback.
private function set_loginTime($loginTime)  { $this->set_hbAuthData(array('loginTime' => $loginTime)); }

public function logged_out($username,$auth)                                                 # Logout successfull callback. 
{ $this->set_loginTime(null); 
  $this->set_editingTime(null); 
  $this->set_idleTime(0); 
} 

private  $idle_time = 6000;              # Idle time in seconds (DB hb.members.idleTime will be set to 0 upon logout)
private function set_idleTime($idleTime) { $this->set_hbAuthData(array('idleTime' => $idleTime ? time() + $idleTime : 0)); }
public function get_idleTime()      { $row = $this->get_hbAuthData(array('idleTime')); return $row['idleTime']; }
public function is_idle()           { return (time() - $this->get_idleTime() > 0); }

#============================================================================================================================
# Editor session configuration and info.
#============================================================================================================================
public function can_edit()   { $role = $this->getAuthData('role'); return($role == 'Editor' || $role == 'Administrator'); }
public function is_editing() { return ($this->can_edit() && ($this->get_editingTime() != null)); }

private function set_editingTime($editingTime) { $this->set_hbAuthData(array('editingTime' => $editingTime)); }
private function get_editingTime() { $row = $this->get_hbAuthData(array('editingTime')); return $row['editingTime']; }

#============================================================================================================================
# Member bookmarks (the javascript word position index starts at 0, not 1; e.g. first word = Gen.1.1.0)
#============================================================================================================================
public function set_reference($ref)     # Validate the reference string before storing it in the DB. 
{ function is_err($flds) { for ($i=0,$cnt=count($flds); $i<$cnt; ++$i) if ($flds[$i] == null) return true; return false; }
  $flds = explode('.',$ref); 
  if (count($flds)!=5 || is_err($flds)) { echo "ERROR: HBauth->set_reference: BAD REFERENCE: $ref"; exit; }

  $this->set_hbAuthData(array('reference' => $ref)); 
}
public function get_reference() { $row = $this->get_hbAuthData(array('reference')); return $row['reference']; }

#============================================================================================================================
# Functions to set and get member SESSION data from the DB.
#============================================================================================================================
public function set_hbAuthData($data)
{ global $pdo;
  foreach ($data as $col => $value)
  { #$this->setAuthData($col, $value, true);                         # Store as SESSION variable.
    try                                                             # Store in DB.
    { $sql = "UPDATE members SET $col = :$col WHERE username = :username;";
#      echo "</br>$sql</br> $col => $value ; username=" . $this->getUserName() . '</br>'; 
      $s = $pdo->prepare($sql);
      $s->bindValue(":$col", $value);
      $s->bindValue(':username',  $this->getUserName());
      $s->execute();
    } 
  catch (PDOException $e) { fatal("Error updating $col to database: $e"); }
  }
}

public function get_hbAuthData($data)
{ global $pdo;

  $cols = '';
  foreach ($data as $col) { $cols .= ($cols ? ', ' : '') . $col; }
  try                                                            
  { $sql = "SELECT $cols FROM members WHERE username = :username;";
    $s = $pdo->prepare($sql);
    $s->bindValue(':username',  $this->getUserName());
    $s->execute();
  } 
 catch (PDOException $e) { fatal("Error retrieving $cols from database: $e"); }
 return ($s->fetch());
}

#============================================================================================================================
# __construct() - Use DB container, options, & this callback function for PEAR::Auth to create the login form.
#                 (pre-set the script name for the form's action).
#============================================================================================================================
public function __construct($show_login = true, $allow_reg = true, $login_action = '')
{ 
  $this->set_allow_reg($allow_reg);
  if (!$login_action) $login_action = ''; #$_SERVER['PHP_SELF']; 
  $this->set_login_action($login_action); 
  parent::setFailedLoginCallback('hbAuth::login_failed');              
  parent::setLoginCallback ('hbAuth::logged_in');              
  parent::setLogoutCallback('hbAuth::logged_out');
  parent::__construct('DB', $this->get_options(),'hbAuth::show_login_form', $show_login);

  $this->handle_url_vars();                         # handle GET and POST events.
  if ($this->checkAuth())                           # IF    this is an authenticated and activated member session.
  { if (!$this->is_idle())                          # THEN  IF      not idle    
      $this->set_idleTime($this->idle_time);        #       THEN    refresh idle time (in seconds).
  }
}

private function get_options()          # Define options for the Auth class
{ $dsn = $this->get_dsn(); 
  return array(         
    'dsn'           => $dsn,            #   Data Source Name.
    'table'         => 'members',       #   Table containing authorization data: hb.members.
    'usernamecol'   => 'username',      #   Column of table where the username is stored.
    'passwordcol'   => 'password',      #   Column of table where the password is stored.
    'cryptType'     => 'sha1',          #   Use SHA1() to encrypt the passwords.
    'db_fields'     => '*'              #   Retrieve all fields
    );
}

private function get_dsn()              # Define Data Source Name.
{ $host   = ini_get("mysql.default_host");  
  $user   = ini_get("mysql.default_user");
  $passwd = ini_get("mysql.default_password");
  $dbname = get_dbname();
  $dsn    = "mysqli://$user:$passwd@$host/$dbname";       
  return ($dsn);
}

#============================================================================================================================
# handle_url_vars() - GET and POST event handler for constructor.
#============================================================================================================================
private function handle_url_vars()
{ 
  if (isset($_POST['logsubmit']))       # Login form submitted (anybody has logged in).
  { if ($_POST['logsubmit'] != 'logsubmit') { echo "no logsubmit"; exit; }          # (Illogical but announce error anyway).

# Start authentication, check session validity (login form will be presented for the unauthorized.)

    $this->start(); 

# An authorized (registered) member has logged in! Upon registration, the activation code was set at a unique hash
# and a link to the confirm page was emailed to him. When he confirms registration by clicking the link, the
# activation code is reset to NULL. See if this registered member has activated his account.

    if ($this->getAuthData('activation'))                                 
    { $this->not_activated = true;                                          # IF    member not activated yet  
      $this->checkAuth() && $this->logout();                                # THEN  do not allow him to login, so
      $this->show_login_form();                                             #       log him out immediately and
      return;                                                               #       redisplay the login form.
    }
# An authenticated (registered) and activated member has just logged in (either manually or by browser refresh).

    $this->set_idleTime($this->idle_time);                                  # Refresh idle time (in seconds).
    return;    
  }

  if (isset($_POST['regsubmit']))                                           # Registration form submitted.
  { if ($_POST['regsubmit'] != 'regsubmit') { echo "no regsubmit"; exit; }  # (Illogical but announce error anyway).
    $reg = new Register();                                                  # IF    registration form doesn't validate
    if (!$reg->validate()) { $reg->show_reg_form();  return; }              # THEN  redo the registration form.
    $activation = sha1(uniqid(rand(), true));                               
    $params = array(                                                        # Add the user
      'firstName'    => $reg->first,
      'lastName'     => $reg->last,
      'email'        => $reg->email,       
      'role'         => 'Contributor',
      'rating'       => 0,
      'activation'   => $activation,                                        #  with an activation code
      'registerDate' => nowdate(),                                          #  and a registration date.
      'loginTime'    => null,                                          
      'editingTime'  => null                                         
    );
    if (!parent::addUser($reg->username, $reg->passwd, $params))            # IF    adding the user failed
    { $reg->error='Unable to add user'; $reg->show_reg_form(); return; }    # THEN  redo the registration form.
    if (!$reg->sendConfirmation($activation,true))                          # IF    confirmation email send failed
    { $reg->show_reg_form(); return; }                                      # THEN  redo the registration form.
    return;
  }

  if (isset($_GET['action'])) switch ($_GET['action'])                      # Check for GET action switches.
    { case 'register':                                                      # 'register' action
      { $reg = new Register(); $reg->show_reg_form();                       # Show empty registration form to register.
        return;                                         
      }
      case 'logout':                                                        # 'logout' action
      { if ($this->checkAuth()) { $this->logout(); }                        # Log out only a logged in user.
        redirect(); return; 
      }   
      case 'startediting':                                                  # 'startediting' action
      { if (!$this->can_edit())
        { $error = 'Only Editors or Administrators may access this page.'; include 'View/accessdenied.html.php'; exit; }
        $this->set_editingTime(nowdate());
        redirect(); return;;
      }   
      case 'stopediting':                                                  # 'stopediting' action
      { $this->set_editingTime(null);
        redirect(); return;
      }   
      default: return;   
    }
 
# No POST or GET args we are concerned with;
 
  $this->start();           # Start authentication, check session validity, show login form if no valid session.
}


#============================================================================================================================
# Form generators (public member functions):
#
# show_login_form   - callback function for PEAR::Auth to create a form for unauthorized users to login.
#                     Must use Post method.
#                     Required form inputs: username & password
#============================================================================================================================
public function show_login_form($username, $status)     
{ #echo $username;
  #echo $status;
  start_html();
?>
  <section>
     <form id="login" method="post" action="<?php echo $this->login_action; ?>">     
         <h3>Login</h3>
         <section>
         <label for="logname">Username</label>
         <input type="text" id="logname" name="username" required <?php echo(as_html_value($_POST['username'])); ?>/>
         <label for="logpass">Password</label>
         <input type="password" id="logpass" name="password"> 
         </section>
         <button id="logsubmit" name="logsubmit" value="logsubmit">Log In</button>
         <?php if (!$this->allow_reg): ?> <p>You must log in. </p>
         <?php else: ?>
            <p>You must log in or <a href="<?php echo $this->login_action?>?action=register"
            title="Go to the registration form." >register</a> to access this page.
            </p>
         <?php endif; ?>
     </form>
<?php if   ($this->login_error)   echo('<form><p>Invalid username/password; Please try again. </p></form>'); ?>
<?php if   ($this->not_activated)  echo('<form><p>You have not activated your account yet!</p></form>'); ?>
  </section>
  </body>
</html>
<?php
} 

} # END CLASS hbAuth


?>
