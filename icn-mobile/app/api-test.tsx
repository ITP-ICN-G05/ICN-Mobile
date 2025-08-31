import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import api from '../constants/api';

export default function ApiTest() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/hello')
      .then(res => setMsg(res.data))
      .catch(err => setMsg('API error: ' + err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 18 }}>
        Backend says: {msg || 'loading...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
