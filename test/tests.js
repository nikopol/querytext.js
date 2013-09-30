test('highlightml', function() {

  'use strict';

  var dom, qt, res;

  dom = document.createElement('div');
  qt = querytext({
    matches: true
  });

  // First test
  qt.parse('foo OR bar');
  dom.innerHTML = 'foo bar';
  res = qt.highlightml(dom, '<i>', '</i>');
  equal(
    res.innerHTML,
    '<i>foo</i> <i>bar</i>',
    'should highlight "foo" and "bar"'
  );

  // Second test
  qt.parse('bar');
  dom.innerHTML = 'foo bar bart';
  res = qt.highlightml(dom, '<i>', '</i>');
  equal(
    res.innerHTML,
    'foo <i>bar</i> bart',
    'should highlight "bar" only'
  );

  // Third test
  qt.parse('bar*');
  dom.innerHTML = 'foo bar bart';
  res = qt.highlightml(dom, '<i>', '</i>');
  equal(
    res.innerHTML,
    'foo <i>bar</i> bart',
    'should highlight "bar" only'
  );

});

test('highlight', function() {

  'use strict';

  var string, qt, res;

  qt = querytext({
    matches: true
  });

  // First test
  qt.parse('("ABUS") AND ("Fahrrad" OR "Helm" OR "Fahrradschloss" OR "Hill Bill" OR "S-Force Peak" OR "S-Force Road" OR "Tec-Tical Pro" OR "Bügelschloss" OR "Faltschloss" OR "Kabelschloss" OR "Rahmenschloss" OR "Fahrradtasche" OR "bike bag" OR "Helmet" OR "lock" OR "cable lock")');
  string = 'Abus Winner 885 Bike / Cycle Bicycle Keyed Cable Lock 185cm Black: £18.98 End Date: Thursday… http://t.co/RQVYhHTB9Z';
  res = qt.highlight(string, '<i>', '</i>');
  equal(
    res,
    '<i>Abus</i> Winner 885 Bike / Cycle Bicycle Keyed <i>Cable Lock</i> 185cm Black: £18.98 End Date: Thursday… http://t.co/RQVYhHTB9Z',
    'should highlight "Abus" and "Cable Lock" only'
  );

  // Second test
  qt.parse('aaaaaa OR eeee OR iiii OR oooooo OR uuuu OR yy OR c OR n OR y');
  string = 'ÁÂÀÅÃÄ áâàåãä ÉÊÈË éêèë ÍÎÌÏ íîìï ÓÔÒØÕÖ óôòøõö ÚÛÙÜ úûùü ýÿ Ç ç Ñ ñ Ý';
  res = qt.highlight(string, '<i>', '</i>');
  equal(
    res,
    '<i>ÁÂÀÅÃÄ</i> <i>áâàåãä</i> <i>ÉÊÈË</i> <i>éêèë</i> <i>ÍÎÌÏ</i> <i>íîìï</i> <i>ÓÔÒØÕÖ</i> <i>óôòøõö</i> <i>ÚÛÙÜ</i> <i>úûùü</i> <i>ýÿ</i> <i>Ç</i> <i>ç</i> <i>Ñ</i> <i>ñ</i> <i>Ý</i>',
    'should highlight all words with accents'
  );

  // Second test
  // Not ready yet
  //
  // qt.parse('a OR o');
  // string = 'Æ æ Œ œ';
  // res = qt.highlight(string, '<i>', '</i>');
  // equal(
  //   res,
  //   '<strong>Æ</strong> <strong>æ</strong> <strong>Œ</strong> <strong>œ</strong>',
  //   'should highlight all words with double chars'
  // );

});
