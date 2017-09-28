<?php
require_once 'Library/helpers.inc.php';
require_once 'Model/ChapterReference.php';
require_once 'Model/Alert.php';
#****************************************************************************************************************************
# ChapterMarkup class -- construct the HTML markup for a chapter.
#****************************************************************************************************************************
class ChapterMarkup
{

protected $chapterRef;                              # ChapterReference class object
public function get_chapterRef()                    { return($this->chapterRef); }

public function __construct($chapterRef) { $this->chapterRef = new ChapterReference($chapterRef); }

#============================================================================================================================
# getMarkup() - generate html markup for the referenced chapter.
#============================================================================================================================
public function getMarkup() { return $this->MarkupChapter(); }     # returns string containing html markup.

protected function MarkupChapter()
{ $cr = $this->chapterRef;                                          # variables of convenience
  $result = $cr->get_chapterwords();

  $out  = "<div><div id ='"  . $cr->refstr . "'>";                          # E.g. Gen.1
  $title = "status: " . $cr->get_alert_status();
  $out .= span(null, 'chapter', $title, $cr->fullname);                     # E.g. Genisis 1

# Markup the chapter's verses one word at a time while looking for words with a change from the current verse number.

  for ($verseNumber = 0; $row = $result->fetch(); $out .= $this->MarkupWord($row,$pre))
  { $pre= '';
    if ($row['verse'] != $verseNumber)                                  # This is the first word of a new verse, so
    { if ($verseNumber)     $out .= "</span> ";                         # close the previous verse span, start a new span
      $out .= "<span id='" . $cr->refstr . "." . $row['verse'] . "'>";  # with verse reference string as id, e.g. Gen.1.1,
      $pre = "<sup class='osisID'>" . $row['verse'] . "</sup>&#160;";   # superscript the verse's osisID. Then
      $verseNumber = $row['verse'];                                     # refresh the current verse number.
    }
  }
  $out .= "</span>";                                                    # Close the last verse's span.
  $out .= "</div></div>";           # End divs
  return $out;
}

# Markup one word from a verse given an array ($word) containing data about it.

protected function MarkupWord($word,$pre)               
{ $out  = $this->HebrewSpan($word, $pre);                       # Markup the word as a Hebrew span (span class "Hebrew").
  $out .= span(null,'punctuation', null, $word['append']);      # Punctuation span: append data.
  $out  = span(null,'word', $word['status'], $out);     # Wrap these spans in a "word" span with word "status" as title.
  if (($wt = $word['wordtype']) != 'word')              # IF    the word's type is other than 'word'
  { $out = span(null, $wt, null, $out); }               # THEN  wrap the Hebrew span in a span class of the wordtype
                                                        #       so that it can be styled according to its wordtype.
  return $out;
}

# Span class "Hebrew" will contain:
#      id     - verseword reference string.
#   title     - lemma and optional morph data (with prepended linefeed: entity &#10;).
#   innerHTML - word spelling.

protected function HebrewSpan($word,$pre)
{ $id    = $this->chapterRef->get_vwid($word['verse'], $word['number']);    # "book.chapter.verse.number"
  $title = $word['lemma'] . ($word['morph'] ? "&#10;".$word['morph'] : '');      
  return $pre.span($id, 'Hebrew', $title, $word['word']);
}

} # end class ChapterMarkup

?>
