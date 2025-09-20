import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthContainer from '../../components/common/AuthContainer';

export default function LoginSignUpResetScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image */}
      <Image 
        source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => console.log('Background image load error:', error)}
      />
      
      {/* Top Logo */}
      <Image 
        source={require('../../../assets/ICN Logo Source/ICN-logo-full2.png')} 
        style={styles.topLogo}
        resizeMode="contain"
        onError={(error) => console.log('Top logo load error:', error)}
      />
      
      {/* Auth Container */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authWrapper}>
          <AuthContainer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7B85C',
  },
  backgroundImage: {
    position: 'absolute',
    top: 150,
    left: -100,
    right: 0,
    bottom: 0,
    width: 530,
    height: 530,
    opacity: 0.6, // 透明度调节参数：0=完全透明，1=完全不透明
  },
  topLogo: {
    position: 'absolute',
    top: 30, // 距离顶部的距离
    left: 30, // 距离左边的距离
    width: 200, // logo宽度
    height: 80, // logo高度
    zIndex: 1, // 确保在背景图片之上
    opacity: 0.8
  },
  scrollContainer: {
    flex: 1,
    marginTop: 120, // 为顶部logo留出空间
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  authWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 500, // 确保认证容器有足够高度
  },
});