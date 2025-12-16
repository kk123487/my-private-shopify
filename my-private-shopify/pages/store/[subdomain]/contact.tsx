import StoreLayout from './StoreLayout';
import styles from './info.module.css';

export default function ContactPage() {
  return (
    <StoreLayout>
      <div className={styles.infoContainer}>
        <h1>Contact Us</h1>
        <p>
          Have questions or need support? Reach out to us at <a href="mailto:support@yourstore.com">support@yourstore.com</a> and we’ll get back to you as soon as possible.
        </p>
      </div>
    </StoreLayout>
  );
}
