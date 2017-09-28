<?php 
error_reporting(E_ALL);                             # Have to disable E_STRICT reporting for PEAR packages
require_once 'Validate.php';                        # PEAR::Validate
require_once 'View/templates.html.php';              # uses common Oshb site utilities (html rendering).
require_once 'Library/db.inc.php';                  # PDO interface
require_once 'Library/securimage/securimage.php';   # CAPTCHA
require_once 'Mail.php';                            # PEAR::Mail_Mime
require_once 'Mail/mime.php';

#****************************************************************************************************************************
# Register class - display/validate a registration form;
#****************************************************************************************************************************
class Register 
{ 
public $first, $last, $email, $username, $passwd, $confirm;
public $CAPTCHA_error;
public $error;

public function __construct()
{ $this->first      = isset($_POST['regfirst']) ? $_POST['regfirst'] : '';
  $this->last       = isset($_POST['reglast'])  ? $_POST['reglast']  : '';
  $this->email      = isset($_POST['regmail'])  ? $_POST['regmail']  : '';
  $this->username   = isset($_POST['regname'])  ? $_POST['regname']  : '';
  $this->passwd     = isset($_POST['regpass'])  ? $_POST['regpass']  : '';
  $this->confirm    = isset($_POST['confirm'])  ? $_POST['confirm']  : '';

  if (isset($_POST['captcha_code']) && ($x = new Securimage()) && $x->check($_POST['captcha_code']) == false)
  { $this->CAPTCHA_error = true;
    $this->error = "Invalid security response";
  }
  else { $this->CAPTCHA_error = false; $this->error = ''; }
}

public function show_reg_form()     
{ $passpat = 'required pattern="(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$"';

  start_html();
?>
  <section>
    <form id="reg" method="post" >
      <h3>Registration</h3>
      <p>(Field names with an asterisk (*) are required.)</p>
      <label for="regfirst">First Name</label>
      <input type="text" id="regfirst" name="regfirst"  <?php echo(as_html_value($this->first)); ?>/>

      <label for="reglast">Last Name</label>
      <input type="text" id="reglast"  name="reglast"   <?php echo(as_html_value($this->last)); ?>/>

      <label for="regmail">Email*</label>
      <input type="email" id="regmail" name="regmail" required placeholder="john@myhost.com"
        <?php echo(as_html_value($this->email)); ?>/>

      <label for="regname">Username*</label>
      <input type="text" id="regname"  name="regname" required <?php echo (as_html_value($this->username)); ?>/>
      <p>(Username can be the same as your email.)</p></br>

      <p>(Password must be at least 8 characters,
        including uppercase, lowercase, number and punctuation.)</p>
      <label for="regpass">Password*</label>
      <input type="password" id="regpass" name="regpass" <?php echo($passpat); ?>
             placeholder="xR1&Lh0t" 
             title="At least 8 characters and include uppercase, lowercase, numbers and punctuation."
             <?php if($this->CAPTCHA_error) echo(as_html_value($this->passwd)); ?> />
      <label for="confirm">Confirm Password*</label>
      <input type="password" id="confirm" name="confirm"
             title="At least 8 characters and include uppercase, lowercase, numbers and punctuation." 

             <?php if($this->CAPTCHA_error) echo(as_html_value($this->confirm)); ?> />
         <label for="captcha">Enter What You See*</label>
         <img id="captcha" src="Library/securimage/securimage_show.php" alt="CAPTCHA Image"/>
         <input type="text" id="captcha" name="captcha_code" size="10" maxlength="6" required />
	     <span>[ <a href="#" onclick="document.getElementById('captcha').src = 
                    'Library/securimage/securimage_show.php?' + Math.random(); return false"
                    title="Show a different image.">Change Image</a> ]</span>

      <button id="regsubmit" name="regsubmit" value="regsubmit">Register</button>
    </form>
<?php if ($this->error) echo "<form><p>Registration error: $this->error; Please Try again. </p></form>"; ?>
    </section>
</body>
</html>
<?php
} 

public function validate()
{ global $pdo;

  $name_options = array('format' => VALIDATE_ALPHA . VALIDATE_SPACE, 'min_length' => 1 );

  if ($this->first && !Validate::string($this->first,$name_options))  { $this->error = "Invalid first name"; return false; } 
  if ($this->last  && !Validate::string($this->last, $name_options))  { $this->error = "Invalid last name";  return false; }
  if (!Validate::email($this->email))                                 { $this->error = "Invalid email";      return false; }
  if (!Validate::string($this->username,$name_options))               { $this->error = "Invalid username";   return false; }
  if ($this->passwd != $this->confirm)                                { $this->error = "Password mismatch";  return false; }
  if ($this->CAPTCHA_error)                                           { return false; }

  try
  { $sql = "SELECT COUNT(*) AS num_row FROM members WHERE username=:username";
    $s = $pdo->prepare($sql); $s->bindValue(':username',$this->username); $s->execute(); 
    $result = $s->fetch(PDO::FETCH_ASSOC);
  }
  catch (PDOException $e) 
  { $this->error = "Database error when checking for unused username: ".$e->getMessage();  return false; }
  if ($result['num_row'] > 0) { $this->error = "Username already used";  return false; }
  
  try
  { $sql = "SELECT COUNT(*) AS num_row FROM members WHERE email=:email";
    $s = $pdo->prepare($sql); $s->bindValue(':email',$this->email); $s->execute(); 
    $result = $s->fetch(PDO::FETCH_ASSOC);
  }
  catch (PDOException $e) 
  { $this->error = "Database error when checking for unused email: ".$e->getMessage();  return false; }
  if ($result['num_row'] > 0) { $this->error = "Email already used";  return false; }

  return true;
}

#============================================================================================================================
# sendConfirmation() - send a confirmation email.
#                      ( Pear Mail_Mime must be included in the calling script).
#============================================================================================================================
public function sendConfirmation($activation,$html)
{
  $thanks      = 'http://hb.ekfocus.com/OshbParse/View/registerthanks.html.php';     # Thanks for signing up page.
  $listener    = 'http://hb.ekfocus.com/OshbParse/confirm.php';                 # Confirmation page. 
 
  $fromAddress = 'noreply@hb.ekfocus.com';                                      # Email message settingss.
  $ccAddress   = 'darrell@shiloam.net';                                         # For monitoring signups.
  $subject     = 'Open Scriptures Hebrew Bible Parsing Registration Confirmation';
  $to      = array ( "$this->first $this->last" => $this->email);
  $headers = array('From'    => $fromAddress,
                   'Cc'      => $ccAddress,
                   'Subject' => $subject);

# Format the message

  $msg = <<<EOD
<html>
<body>
<h2>Thank you for registering!</h2>
<div>The final step is to confirm your account by clicking on:</div>
<div><confirm_url/></div>
<div>
<b>Open Scriptures Hebrew Parsing Team</b>
</div>
</body>
</html>
EOD;
  $url = "$listener?email=".urlencode($this->email)."&activation=$activation"; 
  if ($html) { $url = "<a href=\"$url\">$url</a>"; }
  $msg = str_replace('<confirm_url/>', $url, $msg);

   $crlf = "\n"; 
   $mime = new Mail_mime($crlf);
   $mime->setTXTBody(strip_tags($msg));
   $mime->setHTMLBody($msg);
   $body    = $mime->get();
   $headers = $mime->headers($headers);
   $mail = Mail::factory('mail');
 

#  $params = array(
#    'host'      => 'mail.shiloam.net',
#    'port'      => '26',
#    'auth'      => false,
#    'username'  => 'darrell@shiloam.net',
#    'password'  => 'Wat4mY40R'
##   'localhost' =>  - The value to give when sending EHLO or HELO. Default is localhost
##   "timeout"       - The SMTP connection timeout. Default is NULL (no timeout).
##   "verp"          - Whether to use VERP or not. Default is FALSE.
##   "debug"         - Whether to enable SMTP debug mode or not. Default is FALSE.
##   "persist"       - Indicates whether or not the SMTP connection should persist over multiple calls to the send() method.
##   "pipelining"    - Indicates whether or not the SMTP commands pipelining should be used.
#    );
#  $mail = Mail::factory('smtp',$params);

   $succ = $mail->send($to, $headers, $body); 
   if (PEAR::isError($succ))
    { $this->error = 'Error sending confirmation email: ' .  $succ->getDebugInfo();  return false; }
  header('Location: '.$thanks); 
  exit;
  return true;
}


}  # END CLASS Register

?>
