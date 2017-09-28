<?php
require_once 'ChapterMarkup.php';
#****************************************************************************************************************************
# EditorMarkup class -- construct Editor version of HTML markup form a chapter.
#****************************************************************************************************************************
class EditorMarkup extends ChapterMarkup
{

# Markup one word for Editors from a verse given an array ($word) containing the data about it.

protected function MarkupWord($word, $pre)  
{ $out   = $this->HebrewSpan($word, $pre);                      # Markup the word as a Hebrew span (span class "Hebrew").
  $out  .= span(null,'punctuation', null, $word['append']);     # Punctuation span: append data.
  $out  .= '<br />';                                            
  $out  .= span(null,'morph',       null, $word['morph'] ? $word['morph'] : "&nbsp;");  # Morph span:  editor markup.

# DHS 6/13 added attribute title with word['status'] HERE HOWDY

  $out   = span(null,'word', $word['status'], $out);    # Wrap these spans in a "word" span with word "status" as title.

  if (($wt = $word['wordtype']) != 'word')              # IF    the word's "type" is other than 'word'
  { $out = span(null, $wt, null, $out); }               # THEN  wrap the word span in a span class of the wordtype
                                                        #       so that it can be styled according to its wordtype.
  return $out; 
}

} # END class EditorMarkup

?>
