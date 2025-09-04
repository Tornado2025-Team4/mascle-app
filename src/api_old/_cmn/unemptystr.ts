export class UnemptyString {
    private value: string;

    private constructor(value: string) {
        if (!value) {
            throw new Error('String cannot be empty');
        }
        this.value = value;
    }

    static new(value: string): UnemptyString {
        return new UnemptyString(value);
    }

    static new_safe(value: string): UnemptyString | null {
        try {
            return new UnemptyString(value);
        } catch {
            return null;
        }
    }

    get v(): string {
        return this.value;
    }
}
