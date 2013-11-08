// querytext.js 0.9 (c) 2012-2013 niko 
// https://github.com/nikopol/querytext.js

/*
test or highlight if a text/html match a boolean query

supported query syntax:

  - AND (including + leading character)
  - OR  (including | character)
  - NOT (including leading ! or - charaters),
  - parenthesis
  - left and right truncatures (with * character)
  - "quotes" for exact matching

constructors:

  querytext()          // get empty querytext object
  querytext("query")   // get a querytext object with a parsed query
  querytext({          // get a querytext object object with options:
    sensitive: false,  //   case sensitive (default=false)
    wholeword: true,   //   whole word only (default=true)
    unaccent: true,    //   accent unsensitive (default=true)
    matches: false,    //   want matched words with their position
    debug: false,      //   console debugging ouput (default=false)
    query: "query"     //   query string
  })                   // return a querytext object

querytext object methods:

  parse('query');    // return {error:"msg",pos:12} or the
                     // querytext object
  
  normalize();       // return the normalized query as string
  
  match('text');     // test if the text match the query
                     // if matches flag is true =>
                     //	   return { word:[pos1,pos2], ... } or false
                     // if matches flag is false =>
                     //    return true or false
  
  dump();            // return a string dump of the query tree
                     // (called after match, its include each
                     // nodes results)
  
  highlight('text','before','after',ishtml)
                     // highlight a text with the query, inserting
                     // 'before' and 'after' around each matching node.
                     // important: option "matches" must have been set
                     // to use this function.
                     // return the text higlighted
  
  highlightml(DOMelement,'before','after')
                     // highlight a DOM tree with the query, inserting
                     // 'before' and 'after' around each matching node.
                     // important: option "matches" must have been set
                     // to use this function.
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
    .highlight("<span class='zob'>zob</span>","[","]");
    //-> "<span class='[zob]'>[zob]</span>"

  querytext({query:"zob",matches:true})
    .highlightml("<span class='zob'>zob</span>","[","]");
    //-> "<span class='zob'>[zob]</span>"

=========================================================================
LICENSE
=========================================================================

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

*/

var querytext=(function(o){

	"use strict";

	var
	unaccent = function(t){
		return t
			//.replace(/Æ/gm,'AE')
			.replace(/[ÁÂÀÅÃÄ]/gm,'A')
			.replace(/Ç/gm,'C')
			.replace(/[ÉÊÈË]/gm,'E')
			.replace(/[ÍÎÌÏ]/gm,'I')
			.replace(/Ñ/gm,'N')
			//.replace(/Œ/gm,'OE')
			.replace(/[ÓÔÒØÕÖ]/gm,'O')
			.replace(/[ÚÛÙÜ]/gm,'U')
			.replace(/Ý/gm,'Y')
			//.replace(/æ/gm,'ae')
			.replace(/[áâàåãä]/gm,'a')
			.replace(/ç/gm,'c')
			.replace(/[éêèë]/gm,'e')
			.replace(/[íîìï]/gm,'i')
			.replace(/ñ/gm,'n')
			.replace(/[óôòøõö]/gm,'o')
			.replace(/[úûùü]/gm,'u')
			.replace(/[ýÿ]/gm,'y')
	},
	lighton = function(match,txt,bef,aft) {
		var k, i, n, p, e, x, l, hl=[];
		//merge intersections
		for(k in match)
			for(i in match[k]) {
				x = false;
				p = match[k][i];
				l = k.length;
				e = p+l-1;
				for(n in hl) {
					if(p>=hl[n].p && p<=hl[n].e) {
						//start intersect
						if(e>hl[n].e) {
							hl[n].e = e;
							hl[n].l = 1+e-hl[n].p;
						}
						x = true;
					} else if(e>=hl[n].p && e<=hl[n].e) {
						//end intersect
						hl[n].p = p;
						hl[n].l = 1+hl[n].e-p;
						x = true;
					} else if(p<hl[n].p && e>hl[n].e) {
						//global intersect
						hl[n].p = p;
						hl[n].e = e;
						hl[n].l = l;
						x = true;
					}
				}
				//no intersection, add it
				if(!x) hl.push({p:p,l:l,e:e});
			}
		//highlight last first
		hl
			.sort(function(a,b){ return b.p-a.p })
			.forEach(function(m){
				txt = txt.substr(0,m.p)+bef+txt.substr(m.p,m.l)+aft+txt.substr(m.p+m.l);
			});
		return txt;
	},
	qt = {
		VERSION: 0.8,
		opts: {
			dftbool: 'OR',
			sensitive: false,
			wholeword: true,
			unaccent: true,
			matches: false,
			debug: false
		},
		error: false,
		query: false,
		tree:  false,
		parse: function(q){
			var parse_branch = function(qry, offset, opts){
				//qry = qry.replace(/(^\s+|\s+$)/g,''); //trim
				if(!offset) offset = 0;
				var
					n = 0,
					not = false,
					mode = false,
					len = qry.length,
					o, op, q, t, p, root,
					add_branch = function(node,src){
						if(not){
							node.not = true;
							if(!mode) mode = 'AND';
							not = false;
						}
						if(node.text){
							var txt = node.text.replace(/(^\s+|\s+$)/gm,'');
							//set truncatures
							var ltrunc = (txt[0] == '*' || !opts.wholeword) ? '' : '(^|[\\s,;:\\-+=<>\\\\\\/\'"\\(\\)~&\\[\\]{}》《，]:?)';
							var rtrunc = (txt.substr(-1) == '*' || !opts.wholeword) ? '' : '($|[\\s,;:\\-+=<>\\\\\\/\'"\\(\\)~&\\[\\]{}》《，]:?)';
							txt = txt.replace(/(^\*|\*$)/g,'');
							//escape special regexp chars
							txt = txt.replace(/([\(\)\+\*\?\:\[\]])/g,"\\$1");
							//concats spaces
							txt = txt.replace(/\s+/g,'\\s+');
							node.rex = new RegExp(
								ltrunc+txt+rtrunc,
								'm'+(opts.sensitive?'':'i')+(opts.matches?'g':'')
							);
						}
						if(src) node.src = src;
						if(root) {
							if(!mode) mode = opts.dftbool;
							if(mode===root.bool && not===(root.not||false))
								root.subs.push(node);
							else
								root = { bool: mode, subs: [ root, node ] };
						} else
							root = node;
						mode = false;
					};

				while( n < len ) {
					if( qry[n] == '"' ) {        //PARSE QUOTES
						o = n++;
						t = '';
						while( n < len && qry[n] != '"' ) t += qry[n++];
						if( n >= len ) return {error:'unbalanced quotes',pos:o+offset};
						if( !t.length || t=='*' ) return {error:'empty quotes',pos:o+offset};
						add_branch({ text: t });
						n++;
					} else if( qry[n] == ')' ) { //PARSE PARENTHESIS
						return {error:'unbalanced parenthesis',pos:o+offset};
					} else if( qry[n] == '(' ) {
						o = n++;
						p = 1;
						t = '';
						while( n < len ){
							if( qry[n] == ')' && --p == 0 ) break;
							if( qry[n] == '(' ) p++;
							t += qry[n];
							if( qry[n] == '"' ) {
								q = n++;
								while( n < len && qry[n] != '"') t += qry[n++];
								t += qry[n];
								if( n >= len ) return {error:'unbalanced quotes',pos:q+offset};
							}
							n++;
						}
						if( n >= len ) return {error:'unbalanced parenthesis',pos:o+offset};
						var b = parse_branch( t, o+1, opts );
						if(b.error) return b;
						add_branch(b,t);
						n++;
					} else if( qry[n] <= ' ' ) { //SKIP SPACES
						while( n < len && qry[n] <= ' ') n++;
					} else if( qry[n] == '+' ) { //AND
						if( not || mode ) return {error:'unexpected operator',pos:n+offset};
						mode = 'AND';
						op = n++;
					} else if( qry[n] == '|' ) { //OR
						if( not || mode ) return {error:'unexpected operator',pos:n+offset};
						mode = 'OR';
						op = n++;
					} else if( qry[n] == '-' || qry[n] == '!' ) { //NOT
						not = !not;
						op = n++;
					} else {                    //PARSE WORD
						o = n;
						t = '';
						while( n < len && qry[n] > ' ' && !/[\(\)\+\-\|\!\"]/.test(qry[n]) ) t += qry[n++];
						if( /^(AND|OR|NOT|NEAR\d)$/i.test(t) ) { //booleans
							op = o;
							var b = RegExp.$1.toUpperCase();
							if( b == 'NOT' ) {
								not = !not;
							} else if( not || mode ) {
								return {error:'unexpected operator',pos:o+offset};
							} else {
								mode = b;
							}
						} else if( t == '*' )
							return {error:'empty word',pos:o+offset};
						else
							add_branch({ text:t });
					}
				}
				if( not || mode ) return {error:'unexpected operator',pos:op+offset};
				return root ? root : {error:'empty query',pos:offset};
			};
			this.error =
			this.tree  = false;
			this.query = this.opts.unaccent ? unaccent(q) : q;
			var b = parse_branch( this.query, 0, this.opts );
			delete this.pos;
			if( b.error ){
				this.error = b.error;
				this.pos = b.pos;
				if(this.opts.debug) console.log(b.error,'at',b.pos);
			} else {
				this.tree = b;
				if(this.opts.debug) console.log(this.dump());
			}
			return this;
		},
		dump: function(node,ind){
			if(!this.tree) return '';
			if(!node) node = this.tree;
			if(!ind) ind = '';
			var
				not = node.not ? 'NOT ' : '',
				src = node.src ? ' : '+not+'('+node.src+')' : '',
				hit = node.match!=undefined ? ' = '+node.match : '';
				self = this;
			return node.bool
				? ind+not+node.bool+hit+src+"\n"+node.subs.map(function(n){ return self.dump(n,ind+' | ') }).join("\n")
				: ind+not+'"'+node.text+'"'+hit;
		},
		normalize: function(node){
			if(!node) node = this.tree;
			if(!node) return '';
			var
				not = node.not ? 'NOT ' : '',
				lst = [],
				self = this;
			if( node.bool ) {
				node.subs.forEach(function(n){ lst.push(self.normalize(n)) });
				return (not || node != this.tree)
					? not+'('+lst.join(' '+node.bool+' ')+')'
					: lst.join(' '+node.bool+' ');
			}
			return /^(and|or|not)$/i.test(node.text) || /[\s\(\)\+\-\!\?\|]/.test(node.text)
				? not+'"'+node.text+'"'
				: not+node.text;
		},
		match: function(txt){
			if(!this.tree) return false;
			var
				self = this,
				reset_node = function(node){
					delete node.match;
					if( node.bool )
						node.subs.forEach(function(n){ reset_node(n) });
				},
				node_match = function(node, text, matches){
					var ok, i, w, p, l;
					if( node.bool ) {
						if(node.bool == 'AND')
							for(ok=true,i=0;i<node.subs.length && ok;++i)
								ok = node_match(node.subs[i],text,matches);
						else
							for(ok=false,i=0;i<node.subs.length;++i){
								ok = node_match(node.subs[i],text,matches) || ok;
								if(ok && !matches) break;
							}
					} else if( matches!==false && !node.not ) {
						ok = false;
						while((i = node.rex.exec(text)) != null){
							ok = true;
							w = i[0];
							p = i.index;
							if( !self.opts.sensitive )
								w = w.toLowerCase();
							if( self.opts.wholeword ){
								l = w.length;
								w = w.replace(/^[\s,;:\-+=<>\\\/'"\(\)~&\[\]{}》《，]+/g,'');
								p += (l-w.length);
								w = w.replace(/[\s,;:\-+=<>\\\/'"\(\)~&\[\]{}》《，]+$/g,'');
								if(l>1) node.rex.lastIndex--;
							}
							if(matches[w]==undefined) matches[w] = [];
							matches[w].push(p);
						}
					} else
						ok = node.rex.test( text );
					if(node.not) ok = !ok;
					node.match = ok;
					return ok;
				},
				ok,
				matches = this.opts.matches ? {} : false;
			reset_node( this.tree );
			ok = node_match( this.tree, this.opts.unaccent ? unaccent(txt) : txt, matches );
			if(this.opts.debug) {
				console.log(this.dump());
				if(matches) console.log(matches);
			}
			return this.opts.matches && ok ? matches : ok;
		},
		highlightml: function(node,bef,aft) {
			if(!this.tree) return node;
			if(!this.opts.matches) return false;
			var htm = node.innerHTML,
				txt = "",
				hl = [],
				k, p, match;
			//mask html tags
			for(k = 0, p=false; k<htm.length; ++k) {
				if(!p) p = htm[k]=='<';
				if(p) {
					p = htm[k]!='>';
					txt += ' ';
				} else
					txt += htm[k];
			}
			//matches
			node.innerHTML = lighton(this.match(txt),htm,bef,aft);
			return node;
		},
		highlight: function(txt,bef,aft,ishtml) {
			if(typeof(txt)=='object')
				return this.highlightml(txt,bef,aft);
			else if (ishtml) {
				var d = document.createElement('div');
				d.innerHTML = txt;
				return this.highlightml(d,bef,aft).innerHTML;
			} else {
				if(!this.tree) return txt;
				if(!this.opts.matches) return false;
				return lighton(this.match(txt),txt,bef,aft);
			}
		}
	};
	if(o){
		if(typeof(o)=='string')
			qt.parse(o);
		else if(typeof(o)=='object') {
			//merge options
			for(var k in qt.opts)
				if(o[k]!==undefined)
					qt.opts[k]=o[k];
			if(o.query) qt.parse(o.query);
		}
	}
	return qt;
});
