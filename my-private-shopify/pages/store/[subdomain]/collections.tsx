import StoreLayout from './StoreLayout';
import styles from './info.module.css';

export default function CollectionsPage() {
  return (
    <StoreLayout>
      <div className={styles.collectionsContainer}>
        <h1>Collections</h1>
        <p>
          Explore our curated collections of products. More coming soon!
        </p>
      </div>
    </StoreLayout>
  );
}
