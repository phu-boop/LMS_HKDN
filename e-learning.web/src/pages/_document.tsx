import * as React from 'react';
// next
import Document, { Html, Head, Main, NextScript } from 'next/document';
// emotion
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
// theme
import palette from '../theme/palette';

// ----------------------------------------------------------------------

function createEmotionCache() {
  return createCache({ key: 'css' });
}

type DocumentWithEmotion = {
  emotionStyleTags?: React.ReactElement[];
};

export default class MyDocument extends Document<DocumentWithEmotion> {
  render() {
    const { emotionStyleTags } = this.props;

    return (
      <Html lang="en">
        <Head>
          {emotionStyleTags}
          <meta charSet="utf-8" />

          <link rel="icon" type="image/png" href="/logo/logo_single_light.png" />
          <link rel="shortcut icon" href="/logo/logo_single_light.png" />

          <meta name="theme-color" content={palette.light.primary.main} />

          <link rel="manifest" href="/manifest.json" />

          <link rel="preconnect" href="https://fonts.gstatic.com" />

          <link
            href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />

          <meta
            name="description"
            content="Hệ thống LMS của AIG Education đóng vai trò là trục cốt lõi trong chuyển đổi số giáo dục, kết nối chặt chẽ giữa Nhà trường - Giáo viên - Học sinh. Hệ thống giúp đơn giản hóa quy trình vận hành, nâng cao chất lượng tương tác nhờ kho học liệu số sinh động, từ đó tối ưu hóa chi phí triển khai và nâng cao hiệu quả tiếp thu kiến thức cho học sinh."
          />

          <meta name="keywords" content="AIG, AIG Education, LMS, AIG Việt Nam, học liệu số, chuyển đổi số giáo dục, CÔNG TY CỔ PHẦN ĐẦU TƯ CÔNG NGHỆ AIG VIỆT NAM" />

          <meta name="author" content="CÔNG TY CỔ PHẦN ĐẦU TƯ CÔNG NGHỆ AIG VIỆT NAM" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://aigedu.vn/" />
          <meta property="og:title" content="AIG Education - Hệ thống LMS & Chuyển đổi số giáo dục" />
          <meta
            property="og:description"
            content="Hệ thống LMS của AIG Education đóng vai trò là trục cốt lõi trong chuyển đổi số giáo dục, kết nối chặt chẽ giữa Nhà trường - Giáo viên - Học sinh. Hệ thống giúp đơn giản hóa quy trình vận hành, nâng cao chất lượng tương tác nhờ kho học liệu số sinh động, từ đó tối ưu hóa chi phí triển khai và nâng cao hiệu quả tiếp thu kiến thức cho học sinh."
          />
          <meta property="og:image" content="https://aigedu.vn/logo/logo_full_light.png" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://aigedu.vn/" />
          <meta property="twitter:title" content="AIG Education - Hệ thống LMS & Chuyển đổi số giáo dục" />
          <meta
            property="twitter:description"
            content="Hệ thống LMS của AIG Education đóng vai trò là trục cốt lõi trong chuyển đổi số giáo dục, kết nối chặt chẽ giữa Nhà trường - Giáo viên - Học sinh. Hệ thống giúp đơn giản hóa quy trình vận hành, nâng cao chất lượng tương tác nhờ kho học liệu số sinh động, từ đó tối ưu hóa chi phí triển khai và nâng cao hiệu quả tiếp thu kiến thức cho học sinh."
          />
          <meta property="twitter:image" content="https://aigedu.vn/logo/logo_full_light.png" />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// ----------------------------------------------------------------------

MyDocument.getInitialProps = async (ctx) => {
  const originalRenderPage = ctx.renderPage;

  const cache = createEmotionCache();

  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) =>
      (
        <CacheProvider value={cache}>
          <App {...props} />
        </CacheProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);

  const emotionStyles = extractCriticalToChunks(initialProps.html);

  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};
