<?php
#****************************************************************************************************************************
# SignUpException class             - base custom exception class for the SignUp class.
#                                     (Ensures consistent logging to error_log for all exceptions.)
# SignUpDatabaseException class     - indicates database exception in signup process.
# SignUpNotUniqueException class    - indicates user already exists in signup process.
# SignUpEmailException class        - indicates email problem in signup confirmation process.
# SignUpConfirmationException class - indicates confirmation problem in signup process.
#****************************************************************************************************************************
class SignUpException extends Exception
{
public function __construct($message = null, $code = 0) 
{ parent::__construct($message, $code);
  error_log('Error in '.$this->getFile() . ' Line: '.$this->getLine() . ' Error: '.$this->getMessage());
}
} # END class SignUpException

class SignUpDatabaseException     extends SignUpException {}
class SignUpNotUniqueException    extends SignUpException {}
class SignUpEmailException        extends SignUpException {}
class SignUpConfirmationException extends SignUpException {}

#****************************************************************************************************************************
# RegisterConfirm class - confirm registration through an email handshake
#                (this class requires @link http://pear.php.net/package/Mail_Mime/docs Mail_Mime
#****************************************************************************************************************************
class RegisterConfirm
{
protected $db;
#protected $cfg;                       # Configuration array.

protected $from;                      # Name / address (array) the signup email should be sent from.
protected $to;                        # Name / address (array) the signup email should be sent to.
protected $subject;
protected $message;

protected $html;                      # Boolean: whether to send HTML email or not
protected $listener;                  # Url (string) to use for confirmation.
protected $confirmCode;               # Confirmation code (string) to append to $this->listener.

# SignUp constructor
# @param object instance of database connection
# @param string URL for confirming the the signup
# @param string name for confirmation email
# @param string address for confirmation email
# @param string subject of the confirmation message
# @param string the confirmation message containing
#     <confirm_url/>
# @param boolean true if html email, false if text

public function __construct(PDO $db, $listener, $frmName, $frmAddress, $subj, $msg, $html)
{ $this->db             = $db;
#  $this->cfg            = parse_ini_file('config/access_control.ini', TRUE);
  $this->listener       = $listener;
  $this->from[$frmName] = $frmAddress;
  $this->subject        = $subj;
  $this->message        = $msg;
  $this->html           = $html;
}

#============================================================================================================================
# sendConfirmation() - send a confirmation email.
#                      ( Pear Mail_Mime must be included in the calling script).
#============================================================================================================================
public function sendConfirmation()
{ $fromName = key($this->from);
  $hdrs = array( 'From' => $this->from[$fromName], 'Subject' => $this->subject );
  $crlf = "\n"; 
 
  $replace = "$this->listener?code=$this->confirmCode"; 
  if ($this->html) { $replace = "<a href=\"$replace\">$replace</a>"; }
  $this->message = str_replace('<confirm_url/>', $replace, $this->message);

  $mime = new Mail_mime($crlf);
  $mime->setHTMLBody($this->message);
  $mime->setTXTBody(strip_tags($this->message));
  $body = $mime->get();
  $hdrs = $mime->headers($hdrs);
  $params = array(
    'host'      => 'mail.shiloam.net',
    'port'      => '26',
    'auth'      => false,
    'username'  => 'darrell@shiloam.net',
    'password'  => 'Wat4mY40R'
#   'localhost' =>  - The value to give when sending EHLO or HELO. Default is localhost
#   "timeout"       - The SMTP connection timeout. Default is NULL (no timeout).
#   "verp"          - Whether to use VERP or not. Default is FALSE.
#   "debug"         - Whether to enable SMTP debug mode or not. Default is FALSE.
#   "persist"       - Indicates whether or not the SMTP connection should persist over multiple calls to the send() method.
#   "pipelining"    - Indicates whether or not the SMTP commands pipelining should be used.
    );

  $mail = Mail::factory('smtp',$params);
  $succ = $mail->send($this->to, $hdrs, $body); 
  if (PEAR::isError($succ))
    { throw new SignUpEmailException('Error sending confirmation email: ' .  $succ->getDebugInfo()); }
}

#============================================================================================================================
# confirm() - confirm a signup against the confirmation code. If it matches, confirm the member.
#============================================================================================================================
public function confirm($confirmCode)
{ 
  try
  { $sql = "SELECT * FROM members WHERE activation=:confirmCode";
    $s = $this->db->prepare($sql); $s->bindParam(':confirmCode', $confirmCode); $s->execute();
    $row = $s->fetchAll();
  }
  catch (PDOException $e) 
  { throw new SignUpDatabaseException('Database error when looking for confirmation code: '.$e->getMessage());}
  if (count($row) != 1) 
  { throw new SignUpConfirmationException(count($row) . " records found for confirmation code: $confirmCode"); }
    
  try                                                       # Confirm the user.
  { $sql = "UPDATE members SET activation=NULL WHERE activation=:confirmCode LIMIT 1"; 
    $s = $this->db->prepare($sql); $s->bindParam(':confirmCode', $confirmCode); $s->execute();   
  }
  catch (PDOException $e) { throw new SignUpDatabaseException('Database error when confirming user: '.$e->getMessage()); }
}

} # END class Signup



?>
