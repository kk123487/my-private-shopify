
import { GetServerSideProps } from 'next';
// @ts-ignore
import StoreLayout from '../StoreLayout';
import styles from './custom-page.module.css';

interface CustomPageProps {
  title: string;
  content: string;
}


const CustomPage = ({ title, content }: CustomPageProps) => {
  return (
    <StoreLayout>
      <div className={styles.customPageContainer}>
        <h1>{title}</h1>
        <div className={styles.preWrap}>{content}</div>
      </div>
    </StoreLayout>
  );
};


export default CustomPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { subdomain, slug } = context.query;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/custom-pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subdomain, slug }),
  });
  const pages = await res.json();
  const page = Array.isArray(pages) ? pages.find((p) => p.slug === slug) : null;
  if (!page) {
    return { notFound: true };
  }
  return {
    props: {
      title: page.title,
      content: page.content,
    },
  };
};
