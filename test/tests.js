test('highlight', function () {

  'use strict';

  var text, qt;

  qt = querytext({
    matches: true
  });

  // First test
  qt.parse('foo OR bar');
  text = 'foo bar';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    '<i>foo</i> <i>bar</i>',
    'should highlight "foo" and "bar"'
  );

  // Second test
  qt.parse('bar');
  text = 'foo bar bart';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    'foo <i>bar</i> bart',
    'should highlight "bar" only'
  );

  // Right truncature
  qt.parse('bar*');
  text = 'foo bar bart abar abart';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    'foo <i>bar</i> <i>bar</i>t abar abart',
    'should highlight words starting with "bar"'
  );

  // Left truncature
  qt.parse('*bar');
  text = 'foo bar bart abar abart';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    'foo <i>bar</i> bart a<i>bar</i> abart',
    'should highlight words ending with "bar"'
  );

  // Left and right truncature
  qt.parse('*bar*');
  text = 'foo bar bart abar abart';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    'foo <i>bar</i> <i>bar</i>t a<i>bar</i> a<i>bar</i>t',
    'should highlight words starting or ending with "bar"'
  );

  // Complex query
  qt.parse(
    '("ABUS") AND ("Fahrrad" OR "Helm" OR "Fahrradschloss" OR ' +
      '"Hill Bill" OR "S-Force Peak" OR "S-Force Road" OR ' +
      '"Tec-Tical Pro" OR "Bügelschloss" OR "Faltschloss" OR ' +
      '"Kabelschloss" OR "Rahmenschloss" OR "Fahrradtasche" OR ' +
      '"bike bag" OR "Helmet" OR "lock" OR "cable lock")'
  );
  text = 'Abus Winner 885 Bike / Cycle Bicycle Keyed Cable Lock 185cm ' +
    'Black: £18.98 End Date: Thursday… http://t.co/RQVYhHTB9Z';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    '<i>Abus</i> Winner 885 Bike / Cycle Bicycle Keyed <i>Cable Lock</i> ' +
      '185cm Black: £18.98 End Date: Thursday… http://t.co/RQVYhHTB9Z',
    'should highlight "Abus" and "Cable Lock" only'
  );

  // Accents
  qt.parse(
    'aaaaaa OR ' +
    'c OR ' +
    'eeee OR ' +
    'iiii OR ' +
    'n OR ' +
    'oooooo OR ' +
    'uuuu OR ' +
    'yy OR ' +
    'y'
  );
  text =
    'ÁÂÀÅÃÄ ' +
    'áâàåãä ' +
    'Ç ' +
    'ç ' +
    'ÉÊÈË ' +
    'éêèë ' +
    'ÍÎÌÏ ' +
    'íîìï ' +
    'Ñ ' +
    'ñ ' +
    'ÓÔÒØÕÖ ' +
    'óôòøõö ' +
    'ÚÛÙÜ ' +
    'úûùü ' +
    'ýÿ ' +
    'Ý';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    '<i>ÁÂÀÅÃÄ</i> ' +
    '<i>áâàåãä</i> ' +
    '<i>Ç</i> ' +
    '<i>ç</i> ' +
    '<i>ÉÊÈË</i> ' +
    '<i>éêèë</i> ' +
    '<i>ÍÎÌÏ</i> ' +
    '<i>íîìï</i> ' +
    '<i>Ñ</i> ' +
    '<i>ñ</i> ' +
    '<i>ÓÔÒØÕÖ</i> ' +
    '<i>óôòøõö</i> ' +
    '<i>ÚÛÙÜ</i> ' +
    '<i>úûùü</i> ' +
    '<i>ýÿ</i> ' +
    '<i>Ý</i>',
    'should highlight all words with accents'
  );

  // Chinese
  qt.parse('转发');
  text = '央广网北京10月14日消息(记者马文佳)据中国之声《新闻晚高峰》报道，《光明日报》昨天刊发了中国科学院院士、北京大学神经科学研究所名誉所长韩济生的文章名字叫做《在过度医疗背后》。这篇文章引起了各大媒体的相继转发。';
  equal(
    qt.highlight(text, '<i>', '</i>'),
    '央广网北京10月14日消息(记者马文佳)据中国之声《新闻晚高峰》报道，《光明日报》昨天刊发了中国科学院院士、北京大学神经科学研究所名誉所长韩济生的文章名字叫做《在过度医疗背后》。这篇文章引起了各大媒体的相继<i>转发</i>。',
    'should highlight "转发"'
  );

  // Double UTF chars
  // Not ready yet, one day maybe...
  //
  // qt.parse('a OR o OR ss');
  // text = 'Æ æ Œ œ ß';
  // equal(
  //   qt.highlight(text, '<i>', '</i>'),
  //  '<strong>Æ</strong> <strong>æ</strong> <strong>Œ</strong> ' +
  //    '<strong>œ</strong> <strong>ß</strong>',
  //   'should highlight all words with double chars'
  // );

});
