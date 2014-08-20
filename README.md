querytext.js 1.0b (c) 2012-2014 niko
====================================

[![Build Status](https://travis-ci.org/nikopol/querytext.js.png)](https://travis-ci.org/nikopol/querytext.js)

**test or highlight if a text/html matches a boolean query**

supported query syntax:

  - AND (including + leading character)
  - OR  (including | character)
  - NOT (including leading ! or - charaters),
  - parenthesis
  - left and right truncatures (with * character)
  - "quotes" for exact matching
  - "word1 word2"~x
    to search word1 a x words of distance from word2 

constructors:

  querytext()          // get empty querytext object
  querytext("query")   // get a querytext object with a parsed query
  querytext({          // get a querytext object object with options:
    sensitive: false,  //   case sensitive (default=false)
    wholeword: true,   //   whole word only (default=true)
    unaccent: true,    //   accent unsensitive (default=true)
    matches: true ,    //   want matched words with their position (default=true)
                       //     set it to false if you don't need highlighting or
                       //     matches positions
    debug: false,      //   console debugging ouput (default=false)
    query: "query"     //   query string
  })                   // return a querytext object

querytext object methods:

  parse('query');    // return {error:"msg",pos:offset} or the
                     // querytext object
  
  normalize();       // return the normalized query as string
  
  match('text');     // test if the text match the query
                     // if matches flag is true =>
                     //    return an array of matches :
                           [ { txt:"match", ofs:match_offset_in_bytes, pos:word_num } ...]
                     // if matches flag is false =>
                     //    return true or false
  
  dump();            // return a string dump of the query tree
                     // (called after match, its include each
                     // nodes results)
  
  highlight('text','before','after',ishtml)
                     // highlight a text with the query, inserting
                     // 'before' and 'after' around each matching node.
                     // return the text higlighted
  
  highlightml(DOMelement,'before','after')
                     // highlight a DOM tree with the query, inserting
                     // 'before' and 'after' around each matching node.
                     // return the DOMelement higlighted

match usages:

    querytext('!!tata').match('toto TaTa TITI'); //-> true
    querytext('--zaza').match('toto TaTa TITI'); //return false
    querytext('NOT NOT zaza').match('toto ZaZa TITI'); //-> true

    querytext('-tata').match('toto TaTa TITI'); //-> false

    querytext('toto AND "TATA TITI"').match('toto TaTa TITI'); //-> true
    querytext('toto +"TATA TITI"').match('toto TaTa TITI'); //-> true

    querytext({
        query: "T",
        matches: true,
        wholeword: false
    }).match("toto") //-> {t:[0,2]}

analysis usages:

    var qt = querytext('toto AND (tata OR zizi)'); //-> querytext object
    qt.match('toto TaTa TITI');  //-> true
    console.log(qt.dump()); //output the following dump

    AND = true
        | "toto" = true
        | OR = true : (tata OR zizi)
        |  | "tata" = true
        |  | "zizi"

normalization usages:

    querytext('toto tata').normalize() //-> "toto OR tata"
    querytext('to -ta ti').normalize() //-> "(to AND NOT ta) OR ti"

highlight usages:

    querytext({query:"zob",matches:true})
        .highlight("<span class='zob'>zob</span>","[","]")
        //-> "<span class='[zob]'>[zob]</span>"

    querytext({query:"zob",matches:true})
        .highlight("<span class='zob'>zob</span>","[","]",true)
        //-> "<span class='zob'>[zob]</span>"

LICENSE
=======

DO WHAT THE FUCK YOU WANT WITH
ESPECIALLY IF YOU OFFER ME A BEER
PUBLIC LICENSE
Version 1, March 2012

Copyright (C) 2012 - niko

Everyone is permitted to copy and distribute verbatim
or modified copies of this license document, and
changing it is allowed as long as the name is changed.

DO WHAT THE FUCK YOU WANT TO PUBLIC
ESPECIALLY IF YOU OFFER ME A BEER LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND
MODIFICATION :
- You just DO WHAT THE FUCK YOU WANT.
- Especially if you offer me a beer.
