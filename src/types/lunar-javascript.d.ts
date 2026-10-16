declare module "lunar-javascript" {
  export interface LunarJieQi {
    getName(): string;
  }
  export interface DaYun {
    getIndex(): number;
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
  }
  export interface Yun {
    getDaYun(n?: number): DaYun[];
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
  }
  export interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getTimeShiShenGan(): string;
    getDayGan(): string;
    getYun(gender: number): Yun;
  }
  export interface Lunar {
    getEightChar(): EightChar;
    getYearShengXiao(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getDayGan(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getPrevJieQi(wholeDay?: boolean): LunarJieQi | null;
    getDayChongDesc(): string;
    getDaySha(): string;
  }
  export interface SolarDate {
    getLunar(): Lunar;
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): SolarDate;
    fromDate(d: Date): SolarDate;
  };
}
