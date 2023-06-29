#!/usr/bin/env node


// Inputs
// ==========

/** @type {string} 検索するキーワード : コマンドラインの第1引数を使用する */
const inputKeyword = process.argv[2] ?? '';

/**
 * @typedef {Object} DictionaryItem 辞書要素
 * @property {Array<string>} names 同義語の配列
 * @property {Array<DictionaryItem>} [children] 子要素となる類義語の配列
 */
/** @type {Array<DictionaryItem>} 辞書 : `names` プロパティに同義語を配列で記し、`children` 配下に「子要素となる類義語群」を記す */
const exampleDictionary = [
  { names: ['音楽', 'Music'], children: [
    { names: ['ギター', 'Guitar'], children: [
      { names: ['7弦', 'ヘッドレス'] },
      { names: ['弦', 'ストリング', 'String'] },
      { names: ['エフェクター', 'Effector'], children: [
        { names: ['Boss', 'ボス'] },
        { names: ['Mooer'] },
        { names: ['Line6', 'Line 6'] }
      ] },
      { names: ['チューナー', 'Tune', 'Tuner'] },
      { names: ['ペダル'] },
      { names: ['シールド', 'ケーブル', 'パッチ'] },
      { names: ['アンプ', 'Amp'] },
      // ギター種類
      { names: ['ストラト', 'ストラトキャスター', 'Strat', 'Stratocaster', 'ST'] },
      { names: ['テレキャス', 'テレキャスター', 'Tele', 'TL'], children: [
        { names: ['エスクワイア', 'エスクワイヤ', 'Esquire'] }
      ]},
      { names: ['レスポ', 'レスポール', 'Les Paul', 'LP'] },
      { names: ['SG'], children: [
        { names: ['SG1000', 'SG-1000'] }
      ]},
      { names: ['モッキン', 'モッキンバード', 'Mockingbird', 'MG', 'MK'] },
      { names: ['RG', 'JEM'] },
      // ギターメーカー
      { names: ['フェンダー', 'Fender'] },
      { names: ['スクワイア', 'スクワイヤ', 'Squier'] },
      { names: ['ギブソン', 'Gibson'] },
      { names: ['ヤマハ', 'Yamaha'] },
      { names: ['フェルナンデス', 'Fernandes'] },
      { names: ['バーニー', 'Burny'] },
      { names: ['アイバニーズ', 'Ibanez'] },
      { names: ['フォトジェニ', 'フォトジェニック', 'PhotoGenic', 'Photo Genic'] },
      { names: ['Legend'] },
      { names: ['鰤', 'Blitz'] },
      { names: ['バッカス', 'Bacchus'] },
      { names: ['ヴィンテージ', 'ビンテージ', 'Vintage'] },
      { names: ['スタインバーガー', 'Steinberger', 'ホーナー', 'Hohner'] },
    ]},
    { names: ['ベース', 'Bass'], children: [
      { names: ['5弦'] },
      // ベース種類
      { names: ['ジャズベ', 'ジャズベース', 'Jazz Bass'] },
      { names: ['プレベ', 'プレシジョンベース', 'Precision Bass'] },
    ]}
  ]}
];

/** @type {Array<string>} 検索対象テキスト : サンプルテキストを用意 */
const exampleText = [
  'これはサンプルテキストです',
  'Boss コンパクトエフェクターを購入しました',
  '趣味はギターです',
  '音楽を聴くのが好きです',
  'ボスコンの中でも MT-2 が至高',
  '7弦ギターが欲しいな～',
  'ジャズベでドンシャリサウンド'
];


// Functions
// ==========

/**
 * キーワードが `names` プロパティ内に含まれているか
 * 
 * @param {string} keyword 検索するキーワード
 * @param {Array<string>} names 辞書要素の `names` プロパティ値の配列
 * @return {boolean} 含まれていれば `true`
 */
const hasKeywordInNames = (keyword, names) => names.some(name => new RegExp(name, 'i').test(keyword));

/**
 * `children` プロパティが存在するかどうか
 * 
 * @param {Array<{ children?: Array<{DictionaryItem}>; }>} item `children` 配列プロパティを持つ可能性のある要素
 * @return {boolean} `children` プロパティが配列として存在していれば `true`
 */
const hasChildren = item => item.children != null && Array.isArray(item.children);

/**
 * 再帰的にジャンル検索する
 * 
 * @param {string} keyword 検索するキーワード
 * @param {Array<DictionaryItem>} array 辞書もしくは配下の配列
 * @return {DictionaryItem} 検索対象のキーワードを含む要素
 */
const searchGenre = (keyword, array) => {
  for(const item of array) {
    if(hasKeywordInNames(keyword, item.names)) return item;
    if(hasChildren(item)) {
      const childrenResult = searchGenre(keyword, item.children);
      if(childrenResult != null) return childrenResult;
    }
  }
  return null;
};

/**
 * 要素配下から同義語・類義語をまとめる
 * 
 * @param {DictionaryItem} item 辞書または配下の階層の要素
 * @return {Array<string>} 配下の単語を一階層にまとめた同義語・類義語の配列
 */
const flatMapNames = item => {
  const names = item.names;
  if(hasChildren(item)) names.push(...item.children.flatMap(child => flatMapNames(child)));
  return names;
};

/**
 * 検索を実行する
 * 
 * @param {string} keyword 検索するキーワード
 * @param {Array<DictionaryItem>} dictionary 辞書
 * @param {Array<string>} text 検索対象とするテキストの配列
 * @return {Array<string>} 検索キーワードおよびその同義語・類義語が含まれるテキストを返す
 */
const search = (keyword, dictionary, text) => {
  if(keyword == null || keyword === '') return 'Please Input Keyword';
  // 検索キーワードに合致する階層を特定し、その階層配下の同義語・類義語の配列を作成する
  const genre = searchGenre(keyword, dictionary);
  const names = genre == null ? [keyword] : flatMapNames(genre);
  // テキスト中に同義語・類義語を含む場合は Set に追加する
  const matchesSet = new Set();
  names.forEach(name => {
    const nameRegExp = new RegExp(name, 'i');
    text.forEach(line => {
      if(line.match(nameRegExp)) matchesSet.add(line);
    });
  });
  // 検索結果を配列に変換しソートして返す
  const results = [...matchesSet].sort();
  return results.length ? results : 'Not Found';
};


// Main
// ==========

console.log(search(inputKeyword, exampleDictionary, exampleText));
