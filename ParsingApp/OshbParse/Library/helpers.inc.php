<?php
#****************************************************************************************************************************
# helpers.inc.php -- Helper functions used to convert text and user input into HTML for rendering.
#****************************************************************************************************************************
function as_html_value($str) { return( $str ? 'value="'.$str.'"' : ''); }

function html($text)    { return htmlspecialchars($text, ENT_QUOTES, 'UTF-8'); }
function htmlout($text) { echo html($text); }
function span($id, $class, $title, $innerHTML)
{ $id        = ($id        == null) ? '' : " id='$id'";
  $class     = ($class     == null) ? '' : " class='$class'";
  $title     = ($title     == null) ? '' : " title='$title'";
  $innerHTML = ($innerHTML == null) ? '' : $innerHTML;
  return "<span$id$class$title>$innerHTML</span>";
}


function markdown2html($text)
{ $vwidth  = '560';
  $vheight = '315';

  $text = html($text);
  
  $text = preg_replace('/__(.+?)__/s',     '<strong>$1</strong>', $text);   # strong emphasis
  $text = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $text);

  $text = preg_replace('/_([^_]+)_/',       '<em>$1</em>', $text);          # emphasis
  $text = preg_replace('/\*([^\*]+)\*/',    '<em>$1</em>', $text);
  
  $text = str_replace("\r\n", "\n", $text);                                 # Windows   (\r\n) to Unix (\n)
  $text = str_replace("\r",   "\n", $text);                                 # Macintosh (\r)   to Unix (\n)
  
  $text = preg_replace('/!!([1-6])(.+?)!!([1-6])/s',  '<h$1>$2</h$1>', $text);   # heading

  $text = preg_replace('/\[q\](.+?)\[\/q\]/s', '<q>$1</q>', $text);                     # quote 
  $text = preg_replace('/\[bq\](.+?)\[\/bq\]/s', '<blockquote>$1</blockquote>', $text); # blockquote

  $text = preg_replace('/\[ul\]/s', '<ul>', $text);                                       #ul
  $text = preg_replace('/\[\/ul\]/s', '</ul>', $text);
  $text = preg_replace('/\[li\](.+?)\[\/li\]/s', '<li>$1</li>', $text);                     # li 

  $text = '<p>' . str_replace("\n\n", '</p><p>', $text) . '</p>';           # Paragraphs
#  $text = str_replace("\n", '<br>', $text);                                 # Line breaks

  # [linked text](link URL)
  $text = preg_replace('/\[([^\]]+)]\(([-a-z0-9._~:\/?#@!$&\'()*+,;=%]+)\)/i', '<a href="$2">$1</a>', $text);

# [title caption]VIDEO(link URL)
  $video  = '<h3>$1</h3><iframe width="'.$vwidth.'" height="'.$vheight.'" ';
  $video .= 'src="$2" frameborder="0" allowfullscreen=""></iframe>';
  $text = preg_replace('/\[([^\]]+)]VIDEO\(([-a-z0-9._~:\/?#@!$&\'()*+,;=%]+)\)/i', $video, $text);

  return $text;
}
function markdownout($text) { echo markdown2html($text); }
