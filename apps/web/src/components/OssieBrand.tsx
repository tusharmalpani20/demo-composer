import styles from "./OssieBrand.module.css";

export const OssieBrand = () => (
  <span className={styles.lockup}>
    <img
      className={styles.icon}
      src="/brand/ossie-app-icon-64.png"
      alt=""
      aria-hidden="true"
      width="28"
      height="28"
    />
    <span>Ossie</span>
  </span>
);
