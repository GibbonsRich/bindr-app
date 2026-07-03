import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import type { CardGrade } from '@/types/card';

type Props = {
  grade: CardGrade;
};

export default function CardGradePanel({ grade }: Props) {
  return (
    <>
      <View style={styles.gradeGrid} lightColor="transparent" darkColor="transparent">
        <GradeStat label="Centering" value={grade.centering} />
        <GradeStat label="Corners" value={grade.corners} />
        <GradeStat label="Edges" value={grade.edges} />
        <GradeStat label="Surface" value={grade.surface} />
      </View>

      {grade.notes.length > 0 ? (
        <View style={styles.notes} lightColor="transparent" darkColor="transparent">
          {grade.notes.map((note) => (
            <Text key={note} style={styles.note}>
              • {note}
            </Text>
          ))}
        </View>
      ) : null}
    </>
  );
}

function GradeStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.gradeStat} lightColor="transparent" darkColor="transparent">
      <Text style={styles.gradeLabel}>{label}</Text>
      <Text style={styles.gradeValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  gradeStat: {
    minWidth: '42%',
  },
  gradeLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  notes: {
    marginTop: 12,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    opacity: 0.8,
  },
});
