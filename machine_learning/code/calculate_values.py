import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import numpy as np

# Load data
df = pd.read_csv('../data/insurance_data.csv')

# Split
X_train, X_test, y_train, y_test = train_test_split(df[['age']], df.bought_insurance, train_size=0.8, random_state=42)

# Train
model = LogisticRegression()
model.fit(X_train, y_train)

# Accuracy
accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy}")

# Predictions
print("\nX_test (Ages):")
print(X_test)
print("\nPredicted probabilities [prob_0, prob_1]:")
print(model.predict_proba(X_test))

# Model parameters
print("\nModel Parameters:")
print(f"Coefficient (slope): {model.coef_[0][0]}")
print(f"Intercept: {model.intercept_[0]}")

# Custom predictions
sample_ages = np.array([[22], [43], [54]])
probs = model.predict_proba(sample_ages)
print("\nPredictions for sample ages [22, 43, 54]:")
for age, prob in zip(sample_ages, probs):
    print(f"Age {age[0]}: Won't buy: {prob[0]:.4f}, Will buy: {prob[1]:.4f}")
