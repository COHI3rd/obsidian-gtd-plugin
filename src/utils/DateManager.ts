import { format, isToday, isTomorrow, isPast, addDays, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付操作ユーティリティクラス
 * date-fns を使用した日付処理
 */
export class DateManager {
  /**
   * 日付を指定フォーマットで文字列化
   *
   * @param date - 日付
   * @param formatStr - フォーマット文字列（デフォルト: yyyy-MM-dd）
   * @returns フォーマット済み文字列
   */
  static format(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
    return format(date, formatStr, { locale: ja });
  }

  /**
   * 今日の日付を取得
   */
  static getToday(): Date {
    return startOfDay(new Date());
  }

  /**
   * 明日の日付を取得
   */
  static getTomorrow(): Date {
    return addDays(this.getToday(), 1);
  }

  /**
   * 指定日が今日かどうか
   */
  static isToday(date: Date): boolean {
    return isToday(date);
  }

  /**
   * 指定日が明日かどうか
   */
  static isTomorrow(date: Date): boolean {
    return isTomorrow(date);
  }

  /**
   * 指定日が過去かどうか（今日を含まない）
   */
  static isPast(date: Date): boolean {
    return isPast(date) && !isToday(date);
  }

  /**
   * 日付文字列をパース
   *
   * @param dateStr - 日付文字列（YYYY-MM-DD形式）
   * @returns Dateオブジェクト
   */
  static parse(dateStr: string): Date {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${dateStr}`);
    }
    return parsed;
  }

  /**
   * 日付を日本語表示用にフォーマット
   *
   * @param date - 日付
   * @returns "2025年10月30日（水）" 形式
   */
  static toJapaneseString(date: Date): string {
    return format(date, 'yyyy年M月d日（E）', { locale: ja });
  }

  /**
   * 相対的な日付表示を取得
   *
   * @param date - 日付
   * @returns "今日", "明日", "昨日", "3日後", "2日前" など
   */
  static getRelativeString(date: Date): string {
    if (isToday(date)) return '今日';
    if (isTomorrow(date)) return '明日';

    const today = this.getToday();
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === -1) return '昨日';
    if (diffDays > 0) return `${diffDays}日後`;
    if (diffDays < 0) return `${Math.abs(diffDays)}日前`;

    return this.format(date);
  }
}
