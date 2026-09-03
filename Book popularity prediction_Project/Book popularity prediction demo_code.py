import pandas as pd
import numpy as np
import scipy.stats as stats
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

# Set seed for reproducibility
np.random.seed(42)

# ==========================================
# 1. LOAD DATASET & SIMULATE DUMMY STRUCTURE
# ==========================================
# (Replace this block with pd.read_json("book.json") in practice)
num_samples = 1000
data = {
    "title": [f"Book_{i}" for i in range(num_samples)],
    "author": np.random.choice(["Author_A", "Author_B", "Author_C", "Author_D"], num_samples),
    "publisher": np.random.choice(["Publisher_X", "Publisher_Y", "Publisher_Z"], num_samples),
    "category": np.random.choice(["Fiction", "Non-Fiction", "Sci-Fi", "Biography"], num_samples),
    "price": np.random.uniform(10, 50, num_samples),
    "num_pages": np.random.randint(100, 800, num_samples),
    "rating_count": np.random.poisson(lam=100, size=num_samples),
    "average_rating": np.random.uniform(2.5, 5.0, num_samples),
    "review_count": np.random.poisson(lam=50, size=num_samples),
    "book_summary": np.random.choice([
        "An exciting journey through science and fiction.",
        "A detailed biography of historical leadership.",
        "An insightful non-fiction guide to data statistics.",
        "A thrilling mystery novel set in ancient times."
    ], num_samples)
}
df = pd.DataFrame(data)

# ==========================================
# 2. STATISTICAL TARGET LABEL CREATION
# ==========================================
# Rule: Use the 75th percentile of review_count as threshold (Bestseller/High-Popularity Proxy)
threshold = np.percentile(df["review_count"], 75)
df["popularity_label"] = (df["review_count"] > threshold).astype(int)

print(f"--- Popularity Threshold (75th Percentile): {threshold:.2f} reviews ---")
print("Target Class Distribution:")
print(df["popularity_label"].value_counts(normalize=True))
print("\n" + "="*50 + "\n")

# ==========================================
# 3. EXPLORATORY DATA ANALYSIS & HYPOTHESIS TESTING
# ==========================================
# A. Independent Two-Sample t-test: Average Page Count vs Popularity
high_pop_pages = df[df["popularity_label"] == 1]["num_pages"]
low_pop_pages = df[df["popularity_label"] == 0]["num_pages"]
t_stat, p_val = stats.ttest_ind(high_pop_pages, low_pop_pages)

print("--- Statistical Test 1: Two-sample t-test (Pages vs Popularity) ---")
print(f"t-statistic: {t_stat:.4f}, p-value: {p_val:.4f}")
if p_val < 0.05:
    print("Result: Significant difference in page counts between High and Low popularity books.")
else:
    print("Result: No statistically significant difference in page counts.")
print("\n" + "="*50 + "\n")

# B. One-Way ANOVA: Price variation across Categories
categories = [group["price"].values for _, group in df.groupby("category")]
f_stat, anova_p = stats.f_oneway(*categories)

print("--- Statistical Test 2: One-Way ANOVA (Price across Categories) ---")
print(f"F-statistic: {f_stat:.4f}, p-value: {anova_p:.4f}")

print("\n" + "="*50 + "\n")

# ==========================================
# 4. DATA PREPROCESSING & PREVENTING LEAKAGE
# ==========================================
# STRICT DIRECTIVE: Remove review_count from input features to prevent leakage!
X = df.drop(columns=["popularity_label", "review_count", "title"])
y = df["popularity_label"]

# Train-test split (stratified due to class imbalance)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Column preprocessors
numeric_features = ["price", "num_pages", "rating_count", "average_rating"]
categorical_features = ["author", "publisher", "category"]
text_feature = "book_summary"

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("text", TfidfVectorizer(max_features=100), text_feature)
    ]
)

# ==========================================
# 5. MODEL TRAINING & EVALUATION
# ==========================================
# Build model pipeline
pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=100, 
        class_weight="balanced",  # Address class imbalance statistically
        random_state=42
    ))
])

# Fit Pipeline
pipeline.fit(X_train, y_train)

# Evaluate
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

print("--- MODEL PERFORMANCE EVALUATION ---")
print(classification_report(y_test, y_pred))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_proba):.4f}")