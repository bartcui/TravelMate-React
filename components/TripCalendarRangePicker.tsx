// components/TripCalendarRangePicker.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { getTheme } from "@/styles/colors";
import { makeGlobalStyles } from "@/styles/globalStyles";
import { useColorScheme } from "react-native";

type DateObject = {
  year: number;
  month: number;
  day: number;
  timestamp: number;
  dateString: string;
};

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  maxDate?: Date | null;
  minDate?: Date | null;
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void;

  /** If false, user cannot pick dates in the past. Default: true (past allowed). */
  allowPast?: boolean;
  label?: string;
};

// Helpers
const formatDate = (d: Date) => {
  // YYYY-MM-DD
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateString = (s: string) => {
  // s is YYYY-MM-DD
  const [year, month, day] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(year, month - 1, day);
};

export const TripCalendarRangePicker: React.FC<Props> = ({
  startDate,
  endDate,
  maxDate = null,
  minDate = null,
  onChange,
  allowPast = true,
  label = "Select trip dates",
}) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme);
  const gs = makeGlobalStyles(t);

  const today = new Date();
  const todayStr = formatDate(today);

  const [modalVisible, setModalVisible] = useState(false);
  // local satte inside modal so that cancel does not overwrite the parent state
  const [localStart, setLocalStart] = useState<Date | null>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | null>(endDate);

  // when modal opens, sync local state with props
  useEffect(() => {
    if (modalVisible) {
      setLocalStart(startDate);
      setLocalEnd(endDate);
    }
  }, [modalVisible, startDate, endDate]);

  const startStr = localStart ? formatDate(localStart) : undefined;
  const endStr = localEnd ? formatDate(localEnd) : undefined;

  const maxStr = maxDate ? formatDate(maxDate) : undefined;
  const minStr = minDate ? formatDate(minDate) : undefined;

  // Build marked dates for react-native-calendars
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (startStr && endStr) {
      // mark full period from startStr to endStr
      let d = parseDateString(startStr);
      const end = parseDateString(endStr);

      while (d <= end) {
        const key = formatDate(d);
        const isStart = key === startStr;
        const isEnd = key === endStr;

        marks[key] = {
          color: "#3b82f6",
          textColor: "white",
          startingDay: isStart,
          endingDay: isEnd,
        };

        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
    } else if (startStr) {
      // only start selected
      marks[startStr] = {
        startingDay: true,
        endingDay: true,
        color: "#3b82f6",
        textColor: "white",
      };
    }

    // Highlight today differently if it's not already in the range
    if (!marks[todayStr]) {
      marks[todayStr] = {
        marked: true,
        dotColor: "#22c55e",
      };
    } else {
      // If today is already in the range, add a green dot on top
      marks[todayStr] = {
        ...marks[todayStr],
        marked: true,
        dotColor: "#22c55e",
      };
    }

    return marks;
  }, [startStr, endStr, todayStr]);

  const handleDayPress = (day: DateObject) => {
    const selectedDate = parseDateString(day.dateString);
    const selectedStr = day.dateString;

    // Block past dates if allowPast = false
    if (!allowPast && selectedStr < todayStr) {
      //Alert.alert("Invalid date", "You cannot select a date in the past.");
      return;
    }

    // Case A: no start yet, or both start & end already set → start new range
    if (!localStart || (localStart && localEnd)) {
      setLocalStart(selectedDate);
      setLocalEnd(null);
      return;
    }

    // CASE B: We have a start, but no end yet → set end
    if (localStart && !localEnd) {
      const startStrLocal = formatDate(localStart);

      if (selectedStr < startStrLocal) {
        setLocalStart(selectedDate);
        setLocalEnd(null);
        return;
      }

      // same as start → single-day trip
      if (selectedStr === startStrLocal) {
        setLocalEnd(localStart);
        return;
      }

      setLocalEnd(selectedDate);
    }
  };

  const handleSave = () => {
    if (localStart && localEnd && localEnd < localStart) {
      Alert.alert(
        "Invalid date range",
        "End date cannot be before the start date."
      );
      return;
    }
    onChange({ startDate: localStart, endDate: localEnd });
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  // text shown in the field
  const fieldText = (() => {
    if (!startDate) return "Tap to select dates";
    if (!endDate) return `${startDate.toDateString()} (end not set)`;
    return `${startDate.toDateString()} → ${endDate.toDateString()}`;
  })();

  const currentDateForCalendar = startStr ?? minStr ?? todayStr;
  return (
    <>
      <View style={styles.container}>
        {label ? (
          <Text style={gs.label}>
            {label}
            <Text style={gs.asterisk}> *</Text>
          </Text>
        ) : null}
        <Pressable style={gs.dateBtn} onPress={() => setModalVisible(true)}>
          <Text style={gs.dateTxt}>{fieldText}</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCancel}
      >
        <View style={gs.modalBackdrop}>
          {/* tap outside to cancel */}
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Select dates</Text>

            <Calendar
              current={currentDateForCalendar}
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={{
                todayTextColor: "#22c55e",
                arrowColor: "#3b82f6",
                textDisabledColor: "#9ca3af",
              }}
              // hard-limit past navigation
              minDate={minDate ? minStr : allowPast ? undefined : todayStr}
              maxDate={maxDate ? maxStr : undefined}
            />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Start</Text>
                <Text style={styles.summaryValue}>
                  {localStart ? localStart.toDateString() : "Not set"}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>End</Text>
                <Text style={styles.summaryValue}>
                  {localEnd ? localEnd.toDateString() : "Not set (optional)"}
                </Text>
              </View>
            </View>

            <View style={gs.buttonRow}>
              <Pressable
                style={[gs.button, gs.secondaryButton]}
                onPress={handleCancel}
              >
                <Text style={gs.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[gs.button, gs.primaryButton]}
                onPress={handleSave}
              >
                <Text style={gs.primaryButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  wrapper: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 13,
    color: "#111827",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
});
