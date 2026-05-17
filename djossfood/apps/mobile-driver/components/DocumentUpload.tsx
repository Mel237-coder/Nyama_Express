import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { BorderRadii } from '../constants/spacing';
import { FontSizes } from '../constants/typography';
import { FontWeights } from '../constants/typography';

interface DocumentUploadProps {
  label: string;
  onImageSelected: (uri: string) => void;
  imageUri?: string | null;
  required?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  onImageSelected,
  imageUri,
  required = false,
}) => {
  const pickImage = useCallback(async () => {
    // Try image library first, fallback to camera
    const libraryResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!libraryResult.canceled && libraryResult.assets?.[0]) {
      onImageSelected(libraryResult.assets[0].uri);
      return;
    }

    // If library was cancelled, try camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!cameraResult.canceled && cameraResult.assets?.[0]) {
        onImageSelected(cameraResult.assets[0].uri);
      }
    }
  }, [onImageSelected]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <TouchableOpacity
        style={[styles.uploadArea, imageUri ? styles.uploadAreaSelected : null]}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <View style={styles.selectedContent}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.selectedBadge}>
              <Text style={styles.checkmark}>&#10003;</Text>
            </View>
            <Text style={styles.selectedText}>Photo sélectionnée</Text>
          </View>
        ) : (
          <View style={styles.placeholderContent}>
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.placeholderText}>Ajouter une photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  asterisk: {
    color: Colors.error,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: BorderRadii.lg,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  uploadAreaSelected: {
    borderColor: Colors.success,
    borderStyle: 'solid',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 36,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  placeholderText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  selectedContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 100,
    height: 80,
    borderRadius: BorderRadii.sm,
    resizeMode: 'cover',
    marginBottom: Spacing.sm,
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: FontWeights.bold,
  },
  selectedText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    fontWeight: FontWeights.medium,
    marginTop: Spacing.xs,
  },
});

export default DocumentUpload;