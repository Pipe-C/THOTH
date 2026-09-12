import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Badge } from './Badge';
import { SourceType } from '../types';
import { styles } from '../styles/PaperResultViewer.styles';

export interface PaperResultViewerProps {
  title?: string;
  content: string;
  sourcesUsed?: SourceType[];
  antiClicheApplied?: boolean;
  createdAt?: string;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  onCopy?: () => void;
  className?: string;
}

export const PaperResultViewer: React.FC<PaperResultViewerProps> = ({
  title,
  content,
  sourcesUsed = ['institutional'],
  antiClicheApplied = true,
  createdAt,
  onExportPdf,
  onExportDocx,
  onCopy,
  className = '',
}) => {
  const handleShare = async () => {
    try {
      await Share.share({
        title: title || 'Documento Académico TOTH',
        message: `${title ? title + '\n\n' : ''}${content}\n\n— Generado con TOTH (I.U. Pascual Bravo)`,
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const hasInstitutional = sourcesUsed.includes('institutional');
  const hasWeb = sourcesUsed.includes('web');

  return (
    <View style={styles.outerContainer} className={`w-full ${className}`}>
      {/* Floating Paper Card */}
      <View style={styles.paperSheet} className="bg-white rounded-2xl p-6 border border-primary/10">
        {/* Academic Header & Badges */}
        <View style={styles.headerContainer} className="border-b border-primary/10 pb-4 mb-4">
          <View style={styles.badgeRow} className="flex-row flex-wrap items-center gap-2 mb-2">
            {hasInstitutional && (
              <Badge
                label="RAG Institucional validado"
                variant="institutional"
              />
            )}
            {hasWeb && (
              <Badge
                label="Complementado con búsqueda web"
                variant="web"
              />
            )}
            {antiClicheApplied && (
              <Badge
                label="Filtro Anti-Cliché ON"
                variant="accent"
              />
            )}
          </View>

          {title ? (
            <Text style={styles.title} className="font-lexend-bold text-xl text-primary mt-1">
              {title}
            </Text>
          ) : null}

          {createdAt ? (
            <Text style={styles.date} className="font-lexend-medium text-xs text-textSecondary mt-1">
              I.U. Pascual Bravo • {createdAt}
            </Text>
          ) : null}
        </View>

        {/* Paper Content with Academic Reading Typography */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.bodyText} className="font-lexend-regular text-sm text-textPrimary leading-relaxed">
            {content}
          </Text>
        </ScrollView>

        {/* Paper Actions Toolbar */}
        <View style={styles.actionsBar} className="flex-row items-center justify-between pt-4 mt-4 border-t border-primary/10">
          <View style={styles.exportGroup} className="flex-row items-center gap-2">
            {onExportPdf && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onExportPdf}
                style={styles.actionButton}
                className="px-3 py-2 bg-validation rounded-lg"
              >
                <Text style={styles.actionButtonText} className="font-lexend-semibold text-xs text-primary">
                  Exportar PDF
                </Text>
              </TouchableOpacity>
            )}

            {onExportDocx && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onExportDocx}
                style={styles.actionButtonSecondary}
                className="px-3 py-2 bg-toggleOff rounded-lg"
              >
                <Text style={styles.actionButtonSecondaryText} className="font-lexend-semibold text-xs text-textSecondary">
                  Word
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.quickActions} className="flex-row items-center gap-2">
            {onCopy && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCopy}
                style={styles.iconButton}
              >
                <Text style={styles.iconButtonText} className="font-lexend-medium text-xs text-textSecondary">
                  Copiar
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonText} className="font-lexend-medium text-xs text-primary">
                Compartir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
