import React from 'react';
import { Modal, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { BorderRadii } from '../../constants/spacing';
import { Spacing } from '../../constants/spacing';
import { Colors } from '../../constants/colors';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ visible, onClose, children }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.content} pointerEvents="box-none">
        <View style={styles.sheet}>{children}</View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadii.xxl,
    borderTopRightRadius: BorderRadii.xxl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
});

export default Sheet;