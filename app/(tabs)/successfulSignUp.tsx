
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SuccessfulSignUp() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You have successfully signed up!</Text>
      <Button
        title="Sign In"
        onPress={() => router.push('/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
