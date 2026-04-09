import './SimulatorIntro.css'

/**
 * @param {object} props
 * @param {() => void} props.onSelectGasoline
 * @param {() => void} props.onSelectPlugin
 */
export default function SimulatorIntro({ onSelectGasoline, onSelectPlugin }) {
  return (
    <section
      className="sim-intro"
      id="sim-intro"
      aria-labelledby="sim-intro-hero-title sim-intro-title sim-intro-howto-heading"
    >
      <div className="sim-intro-hero">
        <div className="sim-intro-hero-grid">
          <div className="sim-intro-hero-copy">
            <p className="sim-intro-eyebrow" aria-hidden="true">
              Simulator
            </p>
            <h1 id="sim-intro-hero-title" className="sim-intro-hero-heading">
              自動車維持費シミュレーション
            </h1>
            <p className="sim-intro-hero-catch">
              <span className="sim-intro-hero-catch-line">年間のコストが見える、</span>
              <span className="sim-intro-hero-catch-line">内訳が分かる、</span>
              <span className="sim-intro-hero-catch-line">条件で試せる。</span>
            </p>
            <p className="sim-intro-hero-lead">
              ガソリン車・HEVと、BEV・PHEV・FCVで画面を分けています。<br />
              車種データのCSVも区分ごとにインポートできます。
            </p>
            <div className="sim-intro-hero-cta-row">
              <button type="button" className="sim-intro-hero-cta" onClick={onSelectGasoline}>
                ガソリン・HEVで試す
              </button>
              <button type="button" className="sim-intro-hero-cta sim-intro-hero-cta--secondary" onClick={onSelectPlugin}>
                BEV・PHEV・FCVで試す
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sim-intro-divider" aria-hidden="true" />

      <div className="sim-intro-inner">
        <p className="sim-intro-eyebrow" aria-hidden="true">
          Overview
        </p>
        <h2 id="sim-intro-title" className="sim-intro-title">
          年間・月間の維持費を、入力条件から概算できます
        </h2>
        <p className="sim-intro-lead">
          メーカーと車種を選ぶと、車両価格・燃費や電費・車検費用の目安などが自動で入ります。
          <br />
          ガソリン/HEV は従来どおり燃費とガソリン単価。プラグイン系は電気・水素・ガソリンの単価と、PHEV
          の電気走行の割合を足し合わせて試せます。
        </p>

        <ul className="sim-intro-features">
          <li className="sim-intro-feature">
            <span className="sim-intro-feature-badge" aria-hidden="true">
              1
            </span>
            <span className="sim-intro-feature-text">
              <span className="sim-intro-feature-label">車種から自動入力</span>
              データベースのスペックを反映し、手入力の手間を減らします。
            </span>
          </li>
          <li className="sim-intro-feature">
            <span className="sim-intro-feature-badge" aria-hidden="true">
              2
            </span>
            <span className="sim-intro-feature-text">
              <span className="sim-intro-feature-label">内訳で可視化</span>
              計算後は円グラフとリストで、どこにコストが寄っているか確認できます。
            </span>
          </li>
          <li className="sim-intro-feature">
            <span className="sim-intro-feature-badge" aria-hidden="true">
              3
            </span>
            <span className="sim-intro-feature-text">
              <span className="sim-intro-feature-label">区分別CSVで入出力</span>
              ガソリン/HEV用とプラグイン系用のCSVをそれぞれエクスポート・インポートできます。
            </span>
          </li>
          <li className="sim-intro-feature">
            <span className="sim-intro-feature-badge" aria-hidden="true">
              4
            </span>
            <span className="sim-intro-feature-text">
              <span className="sim-intro-feature-label">比較で横並びチェック</span>
              複数の試算を一覧にため、条件や金額の違いを一度に見比べられます。
            </span>
          </li>
        </ul>

        <div className="sim-intro-howto">
          <h3 id="sim-intro-howto-heading" className="sim-intro-howto-title">
            使い方
          </h3>
          <ol className="sim-intro-howto-steps">
            <li className="sim-intro-howto-step">
              <span className="sim-intro-howto-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-car sim-intro-howto-icon" />
              </span>
              <div className="sim-intro-howto-step-body">
                <span className="sim-intro-howto-step-label">区分を選び、メーカーと車種を選ぶ</span>
                <span className="sim-intro-howto-step-text">
                  概要で「ガソリン・HEV」か「BEV・PHEV・FCV」の入力画面を開き、メーカーと車種を指定します。
                </span>
              </div>
            </li>
            <li className="sim-intro-howto-step">
              <span className="sim-intro-howto-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-keyboard sim-intro-howto-icon" />
              </span>
              <div className="sim-intro-howto-step-body">
                <span className="sim-intro-howto-step-label">条件を入力・調整する</span>
                <span className="sim-intro-howto-step-text">
                  年間走行距離、単価、任意保険、駐車場代、保有年数など、ご自身の想定に合わせて編集できます。
                </span>
              </div>
            </li>
            <li className="sim-intro-howto-step">
              <span className="sim-intro-howto-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-calculator sim-intro-howto-icon" />
              </span>
              <div className="sim-intro-howto-step-body">
                <span className="sim-intro-howto-step-label">「計算する」を押す</span>
                <span className="sim-intro-howto-step-text">
                  ボタン一つで年間・月間の維持費と、区分に合ったコスト内訳が求められます。
                </span>
              </div>
            </li>
            <li className="sim-intro-howto-step">
              <span className="sim-intro-howto-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-chart-pie sim-intro-howto-icon" />
              </span>
              <div className="sim-intro-howto-step-body">
                <span className="sim-intro-howto-step-label">結果を確認する</span>
                <span className="sim-intro-howto-step-text">
                  円グラフと一覧でコストの偏りを把握。必要なら結果を CSV でダウンロードして保存・共有できます。
                </span>
              </div>
            </li>
            <li className="sim-intro-howto-step">
              <span className="sim-intro-howto-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-code-compare sim-intro-howto-icon" />
              </span>
              <div className="sim-intro-howto-step-body">
                <span className="sim-intro-howto-step-label">比較に追加する（任意）</span>
                <span className="sim-intro-howto-step-text">
                  結果画面の「比較に追加」でリストに登録し、左ナビの「比較」から一覧表示。表は CSV
                  で書き出せます。
                </span>
              </div>
            </li>
          </ol>
        </div>

        <p className="sim-intro-note" role="note">
          表示はあくまで目安です。ガソリン価格・電気・水素の単価・保険料・駐車場などは地域や契約内容で大きく変わるため、実際の金額とは異なる場合があります。
        </p>
      </div>
    </section>
  )
}
