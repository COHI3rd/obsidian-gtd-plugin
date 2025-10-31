import { Notice } from 'obsidian';

/**
 * エラータイプ
 */
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * GTDプラグイン用のカスタムエラー
 */
export class GTDError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GTDError';
  }
}

/**
 * エラーハンドラー
 * エラーをユーザーフレンドリーなメッセージに変換し、適切に通知する
 */
export class ErrorHandler {
  /**
   * エラーをハンドリングし、ユーザーに通知
   */
  static handle(error: Error | GTDError | unknown, context?: string): void {
    console.error('GTD Plugin Error:', error);

    let message: string;
    let duration: number = 5000;

    if (error instanceof GTDError) {
      message = this.getErrorMessage(error, context);
    } else if (error instanceof Error) {
      message = context ? `${context}: ${error.message}` : error.message;
    } else {
      message = context ? `${context}: 不明なエラーが発生しました` : '不明なエラーが発生しました';
    }

    new Notice(message, duration);
  }

  /**
   * GTDErrorから適切なメッセージを生成
   */
  private static getErrorMessage(error: GTDError, context?: string): string {
    const prefix = context ? `${context}: ` : '';

    switch (error.type) {
      case ErrorType.FILE_NOT_FOUND:
        return `${prefix}ファイルが見つかりません。${error.message}`;

      case ErrorType.PERMISSION_DENIED:
        return `${prefix}ファイルへのアクセスが拒否されました。${error.message}`;

      case ErrorType.PARSE_ERROR:
        return `${prefix}フロントマターの解析に失敗しました。ファイルの形式を確認してください。${error.message}`;

      case ErrorType.VALIDATION_ERROR:
        return `${prefix}入力値が不正です。${error.message}`;

      case ErrorType.NETWORK_ERROR:
        return `${prefix}ネットワークエラーが発生しました。${error.message}`;

      case ErrorType.UNKNOWN_ERROR:
      default:
        return `${prefix}エラーが発生しました。${error.message}`;
    }
  }

  /**
   * ファイル操作のエラーをハンドリング
   */
  static handleFileError(error: Error, filePath: string): void {
    const message = `ファイル操作エラー (${filePath})`;
    this.handle(error, message);
  }

  /**
   * パースエラーをハンドリング
   */
  static handleParseError(error: Error, filePath: string): void {
    const gtdError = new GTDError(
      ErrorType.PARSE_ERROR,
      `ファイル: ${filePath}`,
      error
    );
    this.handle(gtdError, 'フロントマター解析エラー');
  }

  /**
   * バリデーションエラーをハンドリング
   */
  static handleValidationError(message: string): void {
    const gtdError = new GTDError(ErrorType.VALIDATION_ERROR, message);
    this.handle(gtdError);
  }

  /**
   * 成功メッセージを表示
   */
  static success(message: string, duration: number = 3000): void {
    new Notice(`✅ ${message}`, duration);
  }

  /**
   * 警告メッセージを表示
   */
  static warning(message: string, duration: number = 4000): void {
    new Notice(`⚠️ ${message}`, duration);
  }

  /**
   * 情報メッセージを表示
   */
  static info(message: string, duration: number = 3000): void {
    new Notice(`ℹ️ ${message}`, duration);
  }

  /**
   * Try-Catchヘルパー: 非同期関数をラップしてエラーハンドリング
   */
  static async tryCatch<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  /**
   * Try-Catchヘルパー: 同期関数をラップしてエラーハンドリング
   */
  static tryCatchSync<T>(
    fn: () => T,
    context?: string
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }
}
